import React, {useCallback, useEffect, useMemo, useRef} from 'react';
import {View, Dimensions, ScrollView} from 'react-native';
import min from 'lodash/min';
import map from 'lodash/map';

import {Theme} from '../types';
import styleConstructor, {HOURS_SIDEBAR_WIDTH} from './style';
import populateEvents, {HOUR_BLOCK_HEIGHT} from './Packer';
import TimelineHours, {TimelineHoursProps} from './TimelineHours';
import EventBlock, {Event, PackedEvent} from './EventBlock';
import NowIndicator from './NowIndicator';

const {width: dimensionWidth} = Dimensions.get('window');

export interface TimelineProps {
  /**
   * The date of this timeline instance in ISO format (e.g. 2011-10-25)
   */
  date?: string;
  /**
   * List of events to display in this timeline
   */
  events: Event[];
  /**
   * The timeline day start time
   */
  start?: number;
  /**
   * The timeline day end time
   */
  end?: number;
  /**
   * @deprecated
   * Use onEventPress instead
   */
  eventTapped?: (event: Event) => void;
  /**
   * Handle event press
   */
  onEventPress?: (event: Event) => void;
  /**
   * Pass to handle creation of a new event by long press on the timeline background
   * NOTE: If passed, the date prop will be included in the returned time string (e.g. 2017-09-06 01:30:00)
   */
  onBackgroundLongPress?: TimelineHoursProps['onBackgroundLongPress'];
  /**
   * Pass to handle creation of a new event by long press out on the timeline background
   * NOTE: If passed, the date prop will be included in the returned time string (e.g. 2017-09-06 01:30:00)
   */
  onBackgroundLongPressOut?: TimelineHoursProps['onBackgroundLongPressOut'];
  styles?: Theme; //TODO: deprecate (prop renamed 'theme', as in the other components).
  theme?: Theme;
  scrollToFirst?: boolean;
  /**
   * Whether to use 24 hours format for the timeline hours
   */
  format24h?: boolean;
  /**
   * Render a custom event block
   */
  renderEvent?: (event: PackedEvent) => JSX.Element;
  /**
   * Whether to show now indicator
   */
  showNowIndicator?: boolean;
}

const Timeline = (props: TimelineProps) => {
  const {
    format24h = true,
    start = 0,
    end = 24,
    date,
    events = [],
    onEventPress,
    onBackgroundLongPress,
    onBackgroundLongPressOut,
    renderEvent,
    theme,
    scrollToFirst,
    showNowIndicator,
    eventTapped
  } = props;

  const scrollView = useRef<ScrollView>();
  const calendarHeight = useRef((end - start) * HOUR_BLOCK_HEIGHT);
  const styles = useRef(styleConstructor(theme || props.styles, calendarHeight.current));

  const packedEvents = useMemo(() => {
    const width = dimensionWidth - HOURS_SIDEBAR_WIDTH;
    return populateEvents(events, width, start);
  }, [events, start]);

  useEffect(() => {
    if (scrollToFirst) {
      const firstTop = min(map(packedEvents, 'top')) ?? 0;
      const initPosition = firstTop - calendarHeight.current / (end - start);
      const verifiedInitPosition = initPosition < 0 ? 0 : initPosition;

      if (verifiedInitPosition) {
        setTimeout(() => {
          scrollView?.current?.scrollTo({
            y: verifiedInitPosition,
            animated: true
          });
        }, 0);
      }
    }
  }, []);

  const _onEventPress = useCallback(
    (eventIndex: number) => {
      const event = events[eventIndex];
      if (eventTapped) {
        //TODO: remove after deprecation
        eventTapped(event);
      } else {
        onEventPress?.(event);
      }
    },
    [events, onEventPress, eventTapped]
  );

  const renderEvents = () => {
    const events = packedEvents.map((event: PackedEvent, i: number) => {
      return (
        <EventBlock
          key={i}
          index={i}
          event={event}
          styles={styles.current}
          format24h={format24h}
          onPress={_onEventPress}
          renderEvent={renderEvent}
        />
      );
    });

    return (
      <View>
        <View style={{marginLeft: HOURS_SIDEBAR_WIDTH}}>{events}</View>
      </View>
    );
  };

  return (
    // @ts-expect-error
    <ScrollView ref={scrollView} contentContainerStyle={[styles.current.contentStyle, {width: dimensionWidth}]}>
      <TimelineHours
        start={start}
        end={end}
        date={date}
        format24h={format24h}
        styles={styles.current}
        onBackgroundLongPress={onBackgroundLongPress}
        onBackgroundLongPressOut={onBackgroundLongPressOut}
      />
      {renderEvents()}
      {showNowIndicator && <NowIndicator styles={styles.current} />}
    </ScrollView>
  );
};

export {Event as TimelineEventProps, PackedEvent as TimelinePackedEventProps};
export default Timeline;
