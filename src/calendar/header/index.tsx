import includes from 'lodash/includes';
import PropTypes from 'prop-types';
import memoize from 'memoize-one';
import XDate from 'xdate';

import React, {Component, Fragment, ReactNode} from 'react';
import {
  ActivityIndicator,
  Platform,
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleProp,
  ViewStyle,
  AccessibilityActionEvent,
  ColorValue
} from 'react-native';
import {shouldUpdate} from '../../componentUpdater';
import {formatNumbers, weekDayNames} from '../../dateutils';
import {
  CHANGE_MONTH_LEFT_ARROW,
  CHANGE_MONTH_RIGHT_ARROW,
  HEADER_DAY_NAMES,
  HEADER_LOADING_INDICATOR,
  HEADER_MONTH_NAME
  // @ts-expect-error
} from '../../testIDs';
import styleConstructor from './style';
import {Theme, Direction} from '../../types';

export interface CalendarHeaderProps {
  theme?: Theme;
  firstDay?: number;
  displayLoadingIndicator?: boolean;
  showWeekNumbers?: boolean;
  month?: XDate;
  addMonth?: (num: number) => void;
  /** Month format in the title. Formatting values: http://arshaw.com/xdate/#Formatting */
  monthFormat?: string;
  /**  Hide day names */
  hideDayNames?: boolean;
  /** Hide month navigation arrows */
  hideArrows?: boolean;
  /** Replace default arrows with custom ones (direction can be 'left' or 'right') */
  renderArrow?: (direction: Direction) => ReactNode;
  /** Handler which gets executed when press arrow icon left. It receive a callback can go back month */
  onPressArrowLeft?: (method: () => void, month?: XDate) => void;
  /** Handler which gets executed when press arrow icon right. It receive a callback can go next month */
  onPressArrowRight?: (method: () => void, month?: XDate) => void;
  /** Disable left arrow */
  disableArrowLeft?: boolean;
  /** Disable right arrow */
  disableArrowRight?: boolean;
  /** Apply custom disable color to selected day indexes */
  disabledDaysIndexes?: number[];
  /** Replace default title with custom one. the function receive a date as parameter */
  renderHeader?: (date?: XDate) => ReactNode;
  /** Replace default title with custom element */
  customHeaderTitle?: JSX.Element;
  /** Provide aria-level for calendar heading for proper accessibility when used with web (react-native-web) */
  webAriaLevel?: number;
  testID?: string;
  style?: StyleProp<ViewStyle>;
  accessibilityElementsHidden?: boolean;
  importantForAccessibility?: 'auto' | 'yes' | 'no' | 'no-hide-descendants';
}

class CalendarHeader extends Component<CalendarHeaderProps> {
  static displayName = 'CalendarHeader';

  static propTypes = {
    theme: PropTypes.object,
    firstDay: PropTypes.number,
    displayLoadingIndicator: PropTypes.bool,
    showWeekNumbers: PropTypes.bool,
    month: PropTypes.instanceOf(XDate),
    addMonth: PropTypes.func,
    /** Month format in the title. Formatting values: http://arshaw.com/xdate/#Formatting */
    monthFormat: PropTypes.string,
    /**  Hide day names. Default = false */
    hideDayNames: PropTypes.bool,
    /** Hide month navigation arrows. Default = false */
    hideArrows: PropTypes.bool,
    /** Replace default arrows with custom ones (direction can be 'left' or 'right') */
    renderArrow: PropTypes.func,
    /** Handler which gets executed when press arrow icon left. It receive a callback can go back month */
    onPressArrowLeft: PropTypes.func,
    /** Handler which gets executed when press arrow icon right. It receive a callback can go next month */
    onPressArrowRight: PropTypes.func,
    /** Disable left arrow. Default = false */
    disableArrowLeft: PropTypes.bool,
    /** Disable right arrow. Default = false */
    disableArrowRight: PropTypes.bool,
    /** Apply custom disable color to selected day indexes */
    disabledDaysIndexes: PropTypes.arrayOf(PropTypes.number),
    /** Replace default title with custom one. the function receive a date as parameter */
    renderHeader: PropTypes.any,
    /** Replace default title with custom element */
    customHeaderTitle: PropTypes.any,
    /** Provide aria-level for calendar heading for proper accessibility when used with web (react-native-web) */
    webAriaLevel: PropTypes.number
  };

  static defaultProps = {
    monthFormat: 'MMMM yyyy',
    webAriaLevel: 1
  };
  style: any;

  constructor(props: CalendarHeaderProps) {
    super(props);

    this.style = styleConstructor(props.theme);
  }

  shouldComponentUpdate(nextProps: CalendarHeaderProps) {
    if (nextProps.month?.toString('yyyy MM') !== this.props.month?.toString('yyyy MM')) {
      return true;
    }
    return shouldUpdate(this.props, nextProps, [
      'displayLoadingIndicator',
      'hideDayNames',
      'firstDay',
      'showWeekNumbers',
      'monthFormat',
      'renderArrow',
      'disableArrowLeft',
      'disableArrowRight',
      'renderHeader',
      'customHeaderTitle'
    ]);
  }

  addMonth = () => {
    const {addMonth} = this.props;
    addMonth?.(1);
  };

  subtractMonth = () => {
    const {addMonth} = this.props;
    addMonth?.(-1);
  };

  onPressLeft = () => {
    const {onPressArrowLeft, month} = this.props;

    if (typeof onPressArrowLeft === 'function') {
      return onPressArrowLeft(this.subtractMonth, month);
    }

    return this.subtractMonth();
  };

  onPressRight = () => {
    const {onPressArrowRight, month} = this.props;

    if (typeof onPressArrowRight === 'function') {
      return onPressArrowRight(this.addMonth, month);
    }

    return this.addMonth();
  };

  renderWeekDays = memoize(weekDaysNames => {
    const {disabledDaysIndexes} = this.props;

    return weekDaysNames.map((day: string, idx: number) => {
      const dayStyle = [this.style.dayHeader];

      if (includes(disabledDaysIndexes, idx)) {
        dayStyle.push(this.style.disabledDayHeader);
      }

      if (this.style[`dayTextAtIndex${idx}`]) {
        dayStyle.push(this.style[`dayTextAtIndex${idx}`]);
      }

      return (
        <Text allowFontScaling={false} key={idx} style={dayStyle} numberOfLines={1} accessibilityLabel={''}>
          {day}
        </Text>
      );
    });
  });

  renderHeader = () => {
    const {customHeaderTitle, renderHeader, month, monthFormat, testID, webAriaLevel} = this.props;
    const webProps = Platform.OS === 'web' ? {'aria-level': webAriaLevel} : {};

    if (renderHeader) {
      return renderHeader(month);
    }

    if (customHeaderTitle) {
      return customHeaderTitle;
    }

    return (
      <Fragment>
        <Text
          allowFontScaling={false}
          style={this.style.monthText}
          testID={testID ? `${HEADER_MONTH_NAME}-${testID}` : HEADER_MONTH_NAME}
          {...webProps}
        >
          {formatNumbers(month?.toString(monthFormat))}
        </Text>
      </Fragment>
    );
  };

  renderArrow(direction) {
    const {hideArrows, disableArrowLeft, disableArrowRight, renderArrow, testID} = this.props;
    if (hideArrows) {
      return <View />;
    }
    const isLeft = direction === 'left';
    const id = isLeft ? CHANGE_MONTH_LEFT_ARROW : CHANGE_MONTH_RIGHT_ARROW;
    const testId = testID ? `${id}-${testID}` : id;
    const onPress = isLeft ? this.onPressLeft : this.onPressRight;
    const imageSource = isLeft ? require('../img/previous.png') : require('../img/next.png');
    const renderArrowDirection = isLeft ? 'left' : 'right';
    const shouldDisable = isLeft ? disableArrowLeft : disableArrowRight;
    const {addMonth} = this.props;

    return (
      <View style={{flexDirection: "row", paddingBottom: 6}}>
        <TouchableOpacity
          onPress={!shouldDisable ? () => addMonth?.(isLeft ? -12 : 1) : undefined}
          disabled={shouldDisable}
          style={this.style.arrow}
          testID={testId}
        >
          {renderArrow ? (
            renderArrow(renderArrowDirection)
          ) : (
            <Text style={{...this.style.arrowText, textAlign: isLeft ? "left" : "right"}}>{isLeft ? "«" : "›"}</Text>
          )}
        </TouchableOpacity>
        <TouchableOpacity
          onPress={!shouldDisable ? () => addMonth?.(isLeft ? -1 : 12) : undefined}
          disabled={shouldDisable}
          style={this.style.arrow}
          testID={testId}
        >
          {renderArrow ? (
            renderArrow(renderArrowDirection)
          ) : (
            <Text style={{...this.style.arrowText, textAlign: isLeft ? "left" : "right"}}>{isLeft ? "‹" : "»"}</Text>
          )}
        </TouchableOpacity>
      </View>
    );
  }
  
  renderIndicator() {
    const {displayLoadingIndicator, theme, testID} = this.props;

    if (displayLoadingIndicator) {
      return (
        <ActivityIndicator
          color={theme?.indicatorColor as ColorValue}
          testID={testID ? `${HEADER_LOADING_INDICATOR}-${testID}` : HEADER_LOADING_INDICATOR}
        />
      );
    }
  }

  renderDayNames() {
    const {firstDay, hideDayNames, showWeekNumbers, testID} = this.props;
    const weekDaysNames = weekDayNames(firstDay);

    if (!hideDayNames) {
      return (
        <View style={this.style.week} testID={testID ? `${HEADER_DAY_NAMES}-${testID}` : HEADER_DAY_NAMES}>
          {showWeekNumbers && <Text allowFontScaling={false} style={this.style.dayHeader}></Text>}
          {this.renderWeekDays(weekDaysNames)}
        </View>
      );
    }
  }

  render() {
    const {style, testID} = this.props;

    return (
      <View
        testID={testID}
        style={style}
        accessible
        accessibilityRole={'adjustable'}
        accessibilityActions={[
          {name: 'increment', label: 'increment'},
          {name: 'decrement', label: 'decrement'}
        ]}
        onAccessibilityAction={this.onAccessibilityAction}
        accessibilityElementsHidden={this.props.accessibilityElementsHidden} // iOS
        importantForAccessibility={this.props.importantForAccessibility} // Android
      >
        <View style={this.style.header}>
          {this.renderArrow('left')}
          <View style={this.style.headerContainer}>
            {this.renderHeader()}
            {this.renderIndicator()}
          </View>
          {this.renderArrow('right')}
        </View>
        {this.renderDayNames()}
      </View>
    );
  }

  onAccessibilityAction = (event: AccessibilityActionEvent) => {
    switch (event.nativeEvent.actionName) {
      case 'decrement':
        this.onPressLeft();
        break;
      case 'increment':
        this.onPressRight();
        break;
      default:
        break;
    }
  };
}

export default CalendarHeader;
