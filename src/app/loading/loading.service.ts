import {Injectable} from '@angular/core';

@Injectable()
export class LoadingService {

  isLoading: boolean;

  isUploading: boolean;
  uploadProgression: number;

  constructor() {
    this.isLoading = false;
    this.isUploading = false;
  }

  startLoading() {
    this.isLoading = true;
  }

  stopLoading() {
    this.isLoading = false;
  }

  startUploading() {
    this.isUploading = true;
    this.uploadProgression  = 0;
  }

  progressUploading(progression: number) {
    this.uploadProgression  = Math.round(progression);
  }

  stopUploading() {
    this.isUploading = false;
    this.uploadProgression  = 0;
  }

}
