import { faArrowLeft } from '@fortawesome/pro-regular-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  Anchor,
  Button,
  Collapse,
  Group,
  Paper,
  Progress,
  Stack,
  Text,
  ThemeIcon
} from '@mantine/core';
import { ReactNode } from 'react';
import { Task } from './types';

export interface TaskPaneProps {
  task: Task;
  progress: number;
  hasGoBack: boolean;
  onGoBack?(): void;
  areaTitle: ReactNode;
  streakBadge?: ReactNode;
  showAnswer: boolean;
  onToggleShowAnswer(): void;
  actions: ReactNode;
}
export function TasksPane({
  task,
  progress,
  hasGoBack,
  onGoBack,
  areaTitle,
  streakBadge,
  showAnswer,
  onToggleShowAnswer,
  actions
}: TaskPaneProps) {
  return (
    <Paper withBorder p={'md'}>
      <Stack gap={'sm'}>
        <Progress size={'sm'} value={progress * 100} />
        <Group flex={1}>
          {hasGoBack && (
            <Anchor
              component={'button'}
              onClick={() => {
                onGoBack?.();
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
            {areaTitle} - {task.nr}
          </h3>
          {streakBadge}
        </Stack>
        <p
          style={{ whiteSpace: 'pre-wrap', textAlign: 'left' }}
          dangerouslySetInnerHTML={{
            __html: task.question
          }}
        />
        <Group justify="flex-end">
          <Button variant="subtle" onClick={onToggleShowAnswer}>
            <Text>Antwort</Text>
          </Button>
        </Group>
        <Collapse in={showAnswer} transitionDuration={0}>
          <Stack>
            <p
              style={{ whiteSpace: 'pre-wrap', textAlign: 'left' }}
              dangerouslySetInnerHTML={{
                __html: task.answer
              }}
            />
            <Group justify="flex-end">{actions}</Group>
          </Stack>
        </Collapse>
      </Stack>
    </Paper>
  );
}
