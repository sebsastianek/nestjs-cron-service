const MS_IN_MIN = 60000;

const isSameMinute = (date1: Date, date2: Date): boolean => {
  return Math.abs(date1.getTime() - date2.getTime()) < MS_IN_MIN;
};

export { isSameMinute };
