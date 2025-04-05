package main

import (
	"database/sql"
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
	flag.Parse()

	store, err := ConnectStore(*dsn)
	if err != nil {
		log.Fatal(err)
	}

	if *isCreateDb {
		if err = store.Init(); err != nil {
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

	e.PUT("/api/question", func(c echo.Context) error {
		state, err := strconv.Atoi(c.FormValue("state"))
		if err != nil {
			return err
		}
		questionNr := c.FormValue("nr")
		questionArea := c.FormValue("area")

		return store.UpdateUserQuestionState(
			c.Get("user").(int),
			questionNr,
			questionArea,
			state,
		)
	})

	e.POST("/api/testrun", func(c echo.Context) error {
		return store.SaveUserTestRunResult(
			c.Get("user").(int),
			c.FormValue("result"),
		)
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
	progress := UserTotalProgress{
		Tasks:    UserTasksProgress{},
		TestRuns: TestRunsState{},
	}

	rows, err := store.DB.Query(`
		SELECT
				question_nr
			,	question_area
			,	state
		FROM
			user_questions
		WHERE user_id=?
	`, userId)
	if err != nil {
		return progress, err
	}

	for rows.Next() {
		var nr string
		var area string
		var streak int
		err = rows.Scan(&nr, &area, &streak)
		if err != nil {
			return progress, err
		}

		state := QuestionState{
			QuestionNr: nr,
			Streak:     streak,
		}

		if areaState, ok := progress.Tasks[area]; ok {
			progress.Tasks[area] = append(areaState, state)
		} else {
			progress.Tasks[area] = []QuestionState{state}
		}
	}

	row := store.DB.QueryRow("SELECT passed_count, failed_count, oral_count FROM user_test_run_stats WHERE user_id=?", userId)
	var passed sql.NullInt64
	var failed sql.NullInt64
	var oral sql.NullInt64
	err = row.Scan(&passed, &failed, &oral)
	if err != nil {
		if !errors.Is(err, sql.ErrNoRows) {
			return progress, err
		}
	} else {
		if passed.Valid {
			progress.TestRuns.PassedCount = int(passed.Int64)
		}
		if failed.Valid {
			progress.TestRuns.FailedCount = int(failed.Int64)
		}
		if oral.Valid {
			progress.TestRuns.OralCount = int(oral.Int64)
		}
	}

	return progress, nil
}

func (store *Store) GetUserAreaProgress(userId int, area string) ([]QuestionState, error) {
	rows, err := store.DB.Query(`
		SELECT
				question_nr
			,	state
		FROM
			user_questions
		WHERE user_id=? AND question_area=?
	`, userId, area)
	if err != nil {
		return []QuestionState{}, err
	}

	state := []QuestionState{}
	for rows.Next() {
		var nr string
		var streak int
		err = rows.Scan(&nr, &streak)
		if err != nil {
			return []QuestionState{}, err
		}

		state = append(state, QuestionState{
			QuestionNr: nr,
			Streak:     streak,
		})
	}

	return state, nil
}

func (store *Store) UpdateUserQuestionState(userId int, questionNr string, questionArea string, state int) error {
	_, err := store.DB.Exec(`
		INSERT INTO user_questions (question_nr, question_area, user_id, state) VALUES (?, ?, ?, ?)
			ON CONFLICT (question_nr, question_area, user_id) DO UPDATE
				SET state = excluded.state
	`, questionNr, questionArea, userId, state)

	return err
}

func (store *Store) SaveUserTestRunResult(userId int, result string) error {
	targetCol := ""

	if result == "failed" {
		targetCol = "failed_count"
	} else if result == "oral" {
		targetCol = "oral_count"
	} else {
		targetCol = "passed_count"
	}

	_, err := store.DB.Exec(fmt.Sprintf(`
		INSERT INTO user_test_run_stats (user_id, %s) VALUES (?, 1)
			ON CONFLICT (user_id) DO UPDATE
				SET %s=%s + 1
	`, targetCol, targetCol, targetCol), userId)

	return err
}

func (store *Store) Init() error {
	_, err := store.DB.Exec(sqlSchema)
	if err != nil {
		return err
	}
	return err
}
