package main

import (
	"database/sql"
	"encoding/json"
	"errors"
	"flag"
	"fmt"
	"log"
	"log/slog"
	"net/http"
	"os"
	"strconv"

	"github.com/labstack/echo/v4"

	"github.com/labstack/echo/v4/middleware"

	"golang.org/x/crypto/bcrypt"

	_ "embed"

	_ "github.com/mattn/go-sqlite3"
)

//go:embed schema.sql
var sqlSchema string

func main() {
	var dsn = flag.String("db", "", "Db file")
	var isCreateDb = flag.Bool("create-db", false, "Create and init database")
	var questionsFile = flag.String("questions", "", "Question file used during create-db")
	flag.Parse()

	store, err := ConnectStore(*dsn)
	if err != nil {
		log.Fatal(err)
	}

	if *isCreateDb {
		rawQuestions, err := os.ReadFile(*questionsFile)
		if err != nil {
			log.Fatal(err)
		}

		var questions QuestionFile
		err = json.Unmarshal(rawQuestions, &questions)
		if err != nil {
			log.Fatal(err)
		}

		if err = store.Init(questions); err != nil {
			log.Fatal(err)
		}

		slog.Info("database initialized")
		return
	}

	e := echo.New()

	e.Use(middleware.Logger())
	e.Use(middleware.Recover())
	e.Use(middleware.CORSWithConfig(middleware.CORSConfig{
		AllowOrigins:     []string{"http://localhost:5173", "http://localhost:4173"},
		AllowCredentials: true,
	}))
	e.Use(middleware.BasicAuth(func(username, password string, c echo.Context) (bool, error) {
		success, userid, err := store.CheckUserCredentials(username, password)
		if !success {
			return false, err
		} else {
			c.Set("user", userid)
			return true, nil
		}
	}))

	e.GET("/api/progress", func(c echo.Context) error {
		state, err := store.GetUserProgress(c.Get("user").(int))
		if err != nil {
			return err
		}
		return c.JSON(http.StatusOK, state)
	})

	e.GET("/api/progress/:area", func(c echo.Context) error {
		state, err := store.GetUserAreaProgress(c.Get("user").(int), c.Param("area"))
		if err != nil {
			return err
		}
		return c.JSON(http.StatusOK, state)
	})

	e.PUT("/api/question/:id", func(c echo.Context) error {
		state, err := strconv.Atoi(c.FormValue("state"))
		if err != nil {
			return err
		}
		questionId, err := strconv.Atoi(c.Param("id"))
		if err != nil {
			return err
		}
		store.UpdateUserQuestionState(
			c.Get("user").(int),
			questionId,
			state,
		)
		return nil
	})

	e.GET("/*", echo.WrapHandler(http.FileServer(http.FS(os.DirFS("public")))))

	e.Logger.Fatal(e.Start(":1323"))
}

type Store struct {
	DB *sql.DB
}

func ConnectStore(dsn string) (*Store, error) {
	db, err := sql.Open("sqlite3", dsn)
	if err != nil {
		return nil, err

	}
	return &Store{
		DB: db,
	}, nil
}

func (store *Store) CheckUserCredentials(username, plainPassword string) (success bool, userid int, err error) {
	row := store.DB.QueryRow("SELECT password, id FROM users WHERE name=?", username)
	var hashedPassword string
	err = row.Scan(&hashedPassword, &userid)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return false, -1, nil
		} else {
			return false, -1, err
		}
	}
	err = bcrypt.CompareHashAndPassword([]byte(hashedPassword), []byte(plainPassword))
	if err != nil {
		return false, -1, err
	}
	return true, userid, nil
}

func (store *Store) GetUserProgress(userId int) (UserTotalProgress, error) {
	rows, err := store.DB.Query(`
		SELECT
				question_id
			,	questions.area
			,	state
		FROM
			user_questions
		JOIN questions
			ON questions.id = user_questions.question_id
		WHERE user_id=?
	`, userId)
	if err != nil {
		return nil, err
	}

	progress := make(UserTotalProgress)
	for rows.Next() {
		var questionId int
		var area string
		var streak int
		err = rows.Scan(&questionId, &area, &streak)
		if err != nil {
			return nil, err
		}

		state := QuestionState{
			QuestionId: questionId,
			Streak:     streak,
		}

		if areaState, ok := progress[area]; ok {
			progress[area] = append(areaState, state)
		} else {
			progress[area] = []QuestionState{state}
		}
	}

	return progress, nil
}

func (store *Store) GetUserAreaProgress(userId int, area string) ([]QuestionState, error) {
	rows, err := store.DB.Query(`
		SELECT
				question_id
			,	state
		FROM
			user_questions
		JOIN questions
			ON questions.id = user_questions.question_id
		WHERE user_id=? AND questions.area=?
	`, userId, area)
	if err != nil {
		return []QuestionState{}, err
	}

	state := []QuestionState{}
	for rows.Next() {
		var questionId int
		var streak int
		err = rows.Scan(&questionId, &streak)
		if err != nil {
			return []QuestionState{}, err
		}

		state = append(state, QuestionState{
			QuestionId: questionId,
			Streak:     streak,
		})
	}

	return state, nil
}

func (store *Store) UpdateUserQuestionState(userId int, questionId int, state int) error {
	_, err := store.DB.Exec(`
		INSERT INTO user_questions (question_id, user_id, state) VALUES (?, ?, ?)
			ON CONFLICT (question_id, user_id) DO UPDATE
				SET state = excluded.state
	`, questionId, userId, state)

	return err
}

func (store *Store) Init(questions QuestionFile) error {
	_, err := store.DB.Exec(sqlSchema)
	if err != nil {
		return err
	}

	paramStr := ""
	paramVals := []interface{}{}

	for area := range questions {
		areaQuestions := questions[area]
		for _, question := range areaQuestions {
			paramStr += "(?, ?, ?, ?, ?),"
			paramVals = append(paramVals,
				question[0],
				question[1],
				area,
				question[2],
				question[3],
			)
		}
	}

	_, err = store.DB.Exec(fmt.Sprintf("INSERT INTO questions (id, nr, area, question, answer) VALUES %s", paramStr[:len(paramStr)-1]), paramVals...)
	return err
}
