export class Record {
  key?: string;
  name: string;
  recorder: string;
  oratorMail: string;
  duration: number;
  type: string;
  recorderMail: string;
  tags: string[];
  annotations: { time: number, content: string }[];
  filenames: string[];
  lastUpdate: number;
  lastUpdateType: string;
  validate: boolean;
  validationKey: string;
  searchRef: {};

  constructor() {
    this.name = '';
    this.recorder = '';
    this.oratorMail = '';
    this.duration = 0;
    this.type = 'Cours';
    this.recorderMail = '';
    this.tags = [];
    this.annotations = [];
    this.filenames = [];
    this.lastUpdate = 0;
    this.validate = false;
    this.validationKey = '';
    this.searchRef = {};
  }

  static unprettyPrintDuration(duration: string): number {
    const hours = parseInt(duration.substr(0, 2), 10);
    const minutes = parseInt(duration.substr(3, 2), 10);
    const seconds = parseInt(duration.substr(6, 2), 10);

    return hours * 3600 + minutes * 60 + seconds;
  }

  static prettyPrintDuration(duration: number): string {
    let result = '';
    const hours = Math.floor(duration / (60 * 60));

    const divisor_for_minutes = duration % (60 * 60);
    const minutes = Math.floor(divisor_for_minutes / 60);

    const divisor_for_seconds = divisor_for_minutes % 60;
    const seconds = Math.ceil(divisor_for_seconds);

    if (hours < 10) {
      result += '0';
    }
    result += hours + ':';
    if (minutes < 10) {
      result += '0';
    }
    result += minutes + ':';
    if (seconds < 10) {
      result += '0';
    }
    result += seconds;

    return result;
  }

  // array1 - array2
  static fileDiff(array1, array2) {
    const result = [];
    for (let i = 0; i < array1.length; i++) {
      if (array2.indexOf(array1[i]) === -1) {
        result.push(array1[i]);
      }
    }
    return result;
  }
}
