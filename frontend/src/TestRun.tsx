import { Anchor, Button, Group, Paper, Stack, Title } from '@mantine/core';
import { ReactNode, useEffect, useState } from 'react';
import { AREA_DESIGN } from './design';
import { getAreaQuestions } from './settings';
import { TasksPane } from './TaskPane';
import { Areas, Task } from './types';
import { fetchApi, toShuffled } from './utils';

interface TestRunTask extends Task {
  area: Areas;
  choice: 'full' | 'half' | 'false' | null;
}

type TestRunResult = 'passed' | 'oral' | 'failed';

function getPoints(tasks: TestRunTask[]): number {
  const half = tasks.filter((t) => t.choice === 'half');
  const ok = tasks.filter((t) => t.choice === 'full');
  return half.length + ok.length * 2;
}

function getResult(points: number): TestRunResult {
  if (points <= 32) return 'failed';
  else if (points <= 38) return 'oral';
  else return 'passed';
}

export function TestRun() {
  const [tasks, setTasks] = useState<TestRunTask[]>([]);

  useEffect(() => {
    const navTasks = toShuffled(getAreaQuestions('nav'))
      .slice(0, 8)
      .map((t) => ({ ...t, area: 'nav' }));
    const legalTasks = toShuffled(getAreaQuestions('legal'))
      .slice(0, 6)
      .map((t) => ({ ...t, area: 'legal' }));
    const weatherTasks = toShuffled(getAreaQuestions('weather'))
      .slice(0, 4)
      .map((t) => ({ ...t, area: 'weather' }));
    const crewTasks = toShuffled(getAreaQuestions('crew_1'))
      .slice(0, 8)
      .map((t) => ({ ...t, area: 'crew_1' }));

    setTasks(
      [...navTasks, ...legalTasks, ...weatherTasks, ...crewTasks].map(
        (task) =>
          ({
            ...task,
            choice: null
          }) as TestRunTask
      )
    );
  }, []);

  const [showAnswer, setShowAnswer] = useState(false);

  const [currentIndex, setCurrentIndex] = useState(0);
  const currentTask = tasks[currentIndex];

  const [runResult, setResult] = useState<TestRunResult | null>(null);

  if (tasks.length === 0) return <>loading...</>;

  async function updateTask(
    task: TestRunTask,
    choice: NonNullable<TestRunTask['choice']>
  ) {
    const index = tasks.indexOf(task);
    const newTasks = [...tasks];
    newTasks[index] = {
      ...task,
      choice
    };
    setTasks(newTasks);

    // reset global task streak
    if (choice === 'false' || choice === 'half') {
      const form = new FormData();
      form.set('state', '' + 0);
      form.set('nr', task.nr);
      form.set('area', task.area);
      const response = await fetchApi(`/api/question`, {
        method: 'PUT',
        body: form
      });
      if (!response.ok) {
        throw new Error(`Failed to update state`);
      }
    }

    // is last task, submit results
    if (index === tasks.length - 1) {
      const result = getResult(getPoints(newTasks));
      setResult(result);
      const form = new FormData();
      form.set('result', result);
      const response = await fetchApi(`/api/testrun`, {
        method: 'POST',
        body: form
      });
      if (!response.ok) {
        throw new Error(`Failed to update state`);
      }
    } else {
      setCurrentIndex(index + 1);
      setShowAnswer(false);
    }
  }
  let actions: ReactNode = null;

  if (currentTask.choice === null) {
    actions = (
      <>
        <Button
          flex={1}
          variant="light"
          color="red"
          onClick={() => {
            updateTask(currentTask, 'false');
          }}
        >
          Falsch
        </Button>
        <Button
          flex={1}
          variant="light"
          color="orange"
          onClick={() => {
            updateTask(currentTask, 'half');
          }}
        >
          Fast richtig
        </Button>
        <Button
          flex={1}
          variant="light"
          color="green"
          onClick={() => {
            updateTask(currentTask, 'full');
          }}
        >
          Richtig
        </Button>
      </>
    );
  }

  let content: ReactNode;
  if (runResult !== null) {
    const points = getPoints(tasks);
    let title: string;
    if (runResult === 'failed') {
      title = 'Nicht bestanden 💀';
    } else if (runResult === 'oral') {
      title = 'Mündliche Prüfung icomming 😝';
    } else {
      title = 'Bestanden 😊';
    }

    content = (
      <Paper withBorder p={'md'}>
        <Stack gap={'sm'}>
          <div>
            <Title order={3}>{title}</Title>
          </div>
          <p>
            <strong>{points}/60 Punkten</strong>
          </p>
          <Button onClick={() => window.location.reload()}>Nochmal</Button>
        </Stack>
      </Paper>
    );
  } else {
    content = (
      <>
        <Title order={2}>Prüfungsmodus</Title>
        <TasksPane
          task={currentTask}
          progress={(currentIndex + 1) / tasks.length}
          hasGoBack={false}
          areaTitle={AREA_DESIGN[currentTask.area].title}
          showAnswer={showAnswer}
          onToggleShowAnswer={() => {
            setShowAnswer(!showAnswer);
          }}
          actions={actions}
        />
      </>
    );
  }

  return (
    <Stack w={'100%'}>
      <Group>
        <Anchor href="/">Zur Auswahl</Anchor>
      </Group>
      {content}
    </Stack>
  );
}
