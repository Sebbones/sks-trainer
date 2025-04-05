package main

type QuestionState struct {
	QuestionNr string `json:"questionNr"`
	Streak     int    `json:"streak"`
}

type TestRunsState struct {
	PassedCount int `json:"passedCount"`
	FailedCount int `json:"failedCount"`
	OralCount   int `json:"oralCount"`
}

type UserTasksProgress map[string][]QuestionState

type UserTotalProgress struct {
	Tasks    UserTasksProgress `json:"tasks"`
	TestRuns TestRunsState     `json:"testRuns"`
}

type QuestionSeed []interface{}
type QuestionFile map[string][]QuestionSeed
