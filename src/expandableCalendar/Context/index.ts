import React from 'react';
import {UpdateSources} from '../commons';
interface CalendarContextProps {
  date: string;
  prevDate: string;
  setDate: (date: string, source: UpdateSources) => void;
  updateSource: UpdateSources;
  setDisabled: (disable: boolean) => void;
}

// @ts-expect-error
const CalendarContext = React.createContext<CalendarContextProps>({});
export default CalendarContext;
