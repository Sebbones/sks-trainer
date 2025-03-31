import { faArrowLeft } from '@fortawesome/pro-regular-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  Anchor,
  Badge,
  Button,
  Collapse,
  Group,
  Paper,
  Progress,
  Stack,
  Text,
  ThemeIcon
} from '@mantine/core';
import { ReactNode, useEffect, useState } from 'react';
import { useParams } from 'react-router';
import classes from './AreaPage.module.css';
import { AREA_DESIGN, PROGRESS_DESIGN } from './design';
import { getAreaQuestions } from './settings';
import { Areas, Question, QuestionState } from './types';
import { fetchApi, fetchJSON, toShuffled } from './utils';

interface SessionQuestion extends Question {
  streak: QuestionState['streak'];
  correct: boolean | null;
}

function formatText(text: string) {
  const lines = text.split('\n');
  let html = '';

  function writeList(list: string[]) {
    html += `<ul style="list-style:decimal">${list.map((x) => `<li>${x.trim()}</li>`).join('')}</ul>`;
  }

  let currentList: string[] | null = null;
  for (const line of lines) {
    if (/^\s*\d\./.test(line)) {
      if (currentList === null) {
        currentList = [];
      }
      currentList.push(line.replace(/^\s*\d\./, ''));
    } else {
      if (currentList) {
        writeList(currentList);
        currentList = null;
      }
      html += line.trim();
    }
  }

  if (currentList) {
    writeList(currentList);
  }

  return html;
}

function AreaPage() {
  const { area } = useParams() as { area: Areas };
  const [sessionQuestions, setSessionQuestions] = useState<SessionQuestion[]>(
    []
  );
  const [currentQuestionId, setCurrentQuestionId] = useState<number>(-1);
  const [showAnswer, setShowAnswer] = useState(false);

  useEffect(() => {
    setSessionQuestions([]);
    setCurrentQuestionId(-1);
    setShowAnswer(false);

    const areaQuestions: SessionQuestion[] = getAreaQuestions(area).map(
      (q) => ({ ...q, streak: 0, correct: null })
    );
    fetchJSON<QuestionState[]>(`/api/progress/${area}`).then((progress) => {
      for (const state of progress) {
        const question = areaQuestions.find((q) => q.id === state.questionId);
        if (question) {
          question.streak = state.streak;
        }
      }

      const questions = toShuffled(areaQuestions).toSorted(
        (a, b) => a.streak - b.streak
      );

      setSessionQuestions(questions);
      setCurrentQuestionId(questions[0].id);
    });
  }, [area]);

  async function updateQuestion(question: SessionQuestion, correct: boolean) {
    const form = new FormData();
    const newStreak = correct ? question.streak + 1 : 0;
    form.set('state', '' + newStreak);
    const response = await fetchApi(`/api/question/${question.id}`, {
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
    setCurrentQuestionId(nextQuestion.id);
  }

  const currentQuestionIndex = sessionQuestions.findIndex(
    (q) => q.id === currentQuestionId
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
            updateQuestion(currentQuestion, false);
          }}
        >
          Falsch
        </Button>
        <Button
          flex={1}
          variant="light"
          color="green"
          onClick={() => {
            updateQuestion(currentQuestion, true);
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
      <Paper
        className={classes.Page}
        withBorder
        p={'md'}
        data-correct={
          currentQuestion.correct === null ? 'none' : currentQuestion.correct
        }
      >
        <Stack gap={'sm'}>
          <Progress
            size={'sm'}
            value={((currentQuestionIndex + 1) / sessionQuestions.length) * 100}
          />
          <Group flex={1}>
            {currentQuestionIndex !== 0 && (
              <Anchor
                component={'button'}
                onClick={() => {
                  move(-1);
                }}
              >
                <Group gap={3}>
                  <ThemeIcon size={'sm'} color="gray" variant="transparent">
                    <FontAwesomeIcon icon={faArrowLeft} />
                  </ThemeIcon>
                  <Text component="span">Zurück</Text>
                </Group>
              </Anchor>
            )}
          </Group>
          <Stack align="center" gap={0} mb={'md'}>
            <h3>
              {AREA_DESIGN[area].title} - {currentQuestion.nr}
            </h3>
            <Badge
              color={PROGRESS_DESIGN.getStateColor(currentQuestion.streak)}
              variant="light"
            >
              {PROGRESS_DESIGN.getStateText(currentQuestion.streak)}
            </Badge>
          </Stack>
          <p
            style={{ whiteSpace: 'pre-wrap', textAlign: 'left' }}
            dangerouslySetInnerHTML={{
              __html: formatText(currentQuestion.question)
            }}
          />
          <Group justify="flex-end">
            <Button variant="subtle" onClick={() => setShowAnswer(!showAnswer)}>
              <Text>Antwort</Text>
            </Button>
          </Group>
          <Collapse in={showAnswer} transitionDuration={0}>
            <Stack>
              <p
                style={{ whiteSpace: 'pre-wrap', textAlign: 'left' }}
                dangerouslySetInnerHTML={{
                  __html: formatText(currentQuestion.answer)
                }}
              />
              <Group justify="flex-end">{actions}</Group>
            </Stack>
          </Collapse>
        </Stack>
      </Paper>
    </Stack>
  );
}

export default AreaPage;
