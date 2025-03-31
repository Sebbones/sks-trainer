import { MantineColor } from '@mantine/core';
import { WithAreas } from './types';
import { ReactNode } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faCloud,
  faCompass,
  faSailboat,
  faSection,
  faShip
} from '@fortawesome/pro-regular-svg-icons';

export const AREA_DESIGN: WithAreas<{
  color: MantineColor;
  icon: ReactNode;
  title: ReactNode;
}> = {
  nav: {
    title: 'Navigation',
    icon: <FontAwesomeIcon icon={faCompass} />,
    color: 'teal'
  },
  legal: {
    title: 'Schifffahrtsrecht',
    icon: <FontAwesomeIcon icon={faSection} />,
    color: 'blue'
  },
  weather: {
    title: 'Wetterkunde',
    icon: <FontAwesomeIcon icon={faCloud} />,
    color: 'red'
  },
  crew_1: {
    title: 'Seemannschaft I',
    icon: <FontAwesomeIcon icon={faSailboat} />,
    color: 'violet'
  },
  crew_2: {
    title: 'Seemannschaft II',
    icon: <FontAwesomeIcon icon={faShip} />,
    color: 'yellow'
  }
};

export const PROGRESS_DESIGN = {
  getStateColor(state: number): MantineColor {
    if (state === 0) return 'red';
    if (state === 1) return 'orange';
    if (state === 2) return 'yellow';
    return 'green';
  },
  getStateText(state: number): ReactNode {
    return `${state} mal richtig beantwortet`;
  }
};
