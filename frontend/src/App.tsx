import {
  Box,
  Group,
  MantineColor,
  Paper,
  RingProgress,
  Stack,
  Text,
  ThemeIcon,
  Title
} from '@mantine/core';
import { ReactNode } from 'react';
import { NavLink } from 'react-router';
import useSWR from 'swr';
import './App.css';
import { AREA_DESIGN, PROGRESS_DESIGN } from './design';
import { getAreaQuestions } from './settings';
import { Areas, QuestionState, WithAreas } from './types';
import { fetchJSON } from './utils';

function App() {
  const { data } = useSWR<Partial<WithAreas<QuestionState[]>>>(
    '/api/progress',
    fetchJSON
  );

  if (!data) {
    return <p>Loading...</p>;
  }

  console.log('hello :)');

  return (
    <Group justify="center">
      <Stack gap={30}>
        {Object.entries(AREA_DESIGN).map(([area, design]) => (
          <Area
            key={area}
            area={area as Areas}
            title={design.title}
            color={design.color}
            icon={design.icon}
            progress={data[area as Areas] ?? []}
          />
        ))}
      </Stack>
    </Group>
  );
}

function Area({
  area,
  icon,
  title,
  color,
  progress
}: {
  area: Areas;
  icon: ReactNode;
  title: ReactNode;
  color: MantineColor;
  progress: QuestionState[];
}) {
  const totalAreaQuestions = getAreaQuestions(area).length;

  function getStreakProgress(thresholdFn: (s: QuestionState) => boolean) {
    return progress.reduce((total, state) => {
      if (thresholdFn(state)) return total + 1;
      return total;
    }, 0);
  }

  const totalGreen = getStreakProgress((s) => s.streak > 2);

  return (
    <Paper>
      <NavLink to={`/${area}`}>
        <Group>
          <ThemeIcon variant="light" color={color}>
            {icon}
          </ThemeIcon>
          <Box flex={1} style={{ textAlign: 'left' }}>
            <Title order={4}>{title}</Title>
          </Box>
          <RingProgress
            size={60}
            thickness={4}
            label={
              <Text size="sm" c={'dimmed'}>
                {totalAreaQuestions}
              </Text>
            }
            sections={[
              {
                value:
                  (getStreakProgress((s) => s.streak === 0) /
                    totalAreaQuestions) *
                  100,
                color: PROGRESS_DESIGN.getStateColor(0)
              },
              {
                value:
                  (getStreakProgress((s) => s.streak === 1) /
                    totalAreaQuestions) *
                  100,
                color: PROGRESS_DESIGN.getStateColor(1)
              },
              {
                value:
                  (getStreakProgress((s) => s.streak === 2) /
                    totalAreaQuestions) *
                  100,
                color: PROGRESS_DESIGN.getStateColor(2)
              },
              {
                value: (totalGreen / totalAreaQuestions) * 100,
                color: PROGRESS_DESIGN.getStateColor(3)
              }
            ]}
          ></RingProgress>
        </Group>
      </NavLink>
    </Paper>
  );
}

export default App;
