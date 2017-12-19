import {Injectable} from '@angular/core';

@Injectable()
export class LoadingService {

  isLoading: boolean;

  isUploading: boolean;
  uploadProgression: number;
  uploadFilename = '';

  constructor() {
    this.isLoading = false;
    this.isUploading = false;
    this.uploadProgression = 0;
  }

  // Loading

  startLoading() {
    this.isLoading = true;
  }

  stopLoading() {
    this.isLoading = false;
  }

  // Uploading

  startUploading(filename: string) {
    this.isUploading = true;
    this.uploadProgression  = 0;
    this.uploadFilename = filename;
  }

  progressUploading(progression: number) {
    this.uploadProgression  = Math.round(progression);
  }

  stopUploading() {
    this.isUploading = false;
    this.uploadProgression  = 0;
  }

}
