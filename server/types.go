package main

type QuestionState struct {
	QuestionId int `json:"questionId"`
	Streak     int `json:"streak"`
}

type UserTotalProgress map[string][]QuestionState

type QuestionSeed []interface{}
type QuestionFile map[string][]QuestionSeed
