export interface Record {
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
}
