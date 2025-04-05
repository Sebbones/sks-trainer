import { Anchor, Badge, Button, Group, Stack } from '@mantine/core';
import { ReactNode, useEffect, useState } from 'react';
import { useParams } from 'react-router';
import { AREA_DESIGN, PROGRESS_DESIGN } from './design';
import { getAreaQuestions } from './settings';
import { TasksPane } from './TaskPane';
import { Areas, Task, TaskState } from './types';
import { fetchApi, fetchJSON, toShuffled } from './utils';

interface SessionQuestion extends Task {
  streak: TaskState['streak'];
  correct: boolean | null;
}

function AreaPage() {
  const { area } = useParams() as { area: Areas };
  const [sessionQuestions, setSessionQuestions] = useState<SessionQuestion[]>(
    []
  );
  const [currentQuestionNr, setCurrentQuestionNr] = useState<string>('');
  const [showAnswer, setShowAnswer] = useState(false);

  useEffect(() => {
    setSessionQuestions([]);
    setCurrentQuestionNr('');
    setShowAnswer(false);

    const areaQuestions: SessionQuestion[] = getAreaQuestions(area).map(
      (q) => ({ ...q, streak: 0, correct: null })
    );
    fetchJSON<TaskState[]>(`/api/progress/${area}`).then((progress) => {
      for (const state of progress) {
        const question = areaQuestions.find((q) => q.nr === state.questionNr);
        if (question) {
          question.streak = state.streak;
        }
      }

      const questions = toShuffled(areaQuestions).toSorted(
        (a, b) => a.streak - b.streak
      );

      setSessionQuestions(questions);
      setCurrentQuestionNr(questions[0].nr);
    });
  }, [area]);

  async function updateQuestion(
    question: SessionQuestion,
    correct: boolean,
    questionArea: string
  ) {
    const form = new FormData();
    const newStreak = correct ? question.streak + 1 : 0;
    form.set('state', '' + newStreak);
    form.set('nr', '' + question.nr);
    form.set('area', '' + questionArea);
    const response = await fetchApi(`/api/question`, {
      method: 'PUT',
      body: form
    });
    if (!response.ok) {
      throw new Error(`Failed to update state`);
    }

    const newSessionQuestions = [...sessionQuestions];
    const index = newSessionQuestions.indexOf(question);
    newSessionQuestions[index] = {
      ...question,
      streak: newStreak,
      correct
    };
    setSessionQuestions(newSessionQuestions);

    const nextIndex = currentQuestionIndex + 1;
    const hasReachedEnd = nextIndex === sessionQuestions.length;

    if (!hasReachedEnd) {
      move(+1);
    }
  }

  function move(direction: number) {
    const nextIndex = currentQuestionIndex + direction;
    setShowAnswer(false);
    const nextQuestion = sessionQuestions[nextIndex];
    if (nextQuestion.correct != null) {
      setShowAnswer(true);
    }
    setCurrentQuestionNr(nextQuestion.nr);
  }

  const currentQuestionIndex = sessionQuestions.findIndex(
    (q) => q.nr === currentQuestionNr
  );
  const currentQuestion = sessionQuestions[currentQuestionIndex];

  if (!sessionQuestions.length || !currentQuestion) return <p>Loading...</p>;

  let actions: ReactNode = null;
  if (currentQuestion.correct === null) {
    actions = (
      <>
        <Button
          flex={1}
          variant="light"
          color="red"
          onClick={() => {
            updateQuestion(currentQuestion, false, area);
          }}
        >
          Falsch
        </Button>
        <Button
          flex={1}
          variant="light"
          color="green"
          onClick={() => {
            updateQuestion(currentQuestion, true, area);
          }}
        >
          Richtig
        </Button>
      </>
    );
  } else {
    const nextIndex = currentQuestionIndex + 1;
    const hasReachedEnd = nextIndex === sessionQuestions.length;

    if (!hasReachedEnd) {
      actions = (
        <Button
          onClick={() => {
            move(+1);
          }}
        >
          Weiter
        </Button>
      );
    }
  }

  return (
    <Stack w={'100%'}>
      <Group>
        <Anchor href="/">Zur Auswahl</Anchor>
      </Group>
      <TasksPane
        task={currentQuestion}
        progress={(currentQuestionIndex + 1) / sessionQuestions.length}
        hasGoBack={currentQuestionIndex !== 0}
        onGoBack={() => {
          move(-1);
        }}
        areaTitle={AREA_DESIGN[area].title}
        streakBadge={
          <Badge
            color={PROGRESS_DESIGN.getStateColor(currentQuestion.streak)}
            variant="light"
          >
            {PROGRESS_DESIGN.getStateText(currentQuestion.streak)}
          </Badge>
        }
        showAnswer={showAnswer}
        onToggleShowAnswer={() => {
          setShowAnswer(!showAnswer);
        }}
        actions={actions}
      />
    </Stack>
  );
}

export default AreaPage;
