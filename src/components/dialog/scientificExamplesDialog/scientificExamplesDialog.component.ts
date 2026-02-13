import { Component, OnInit ,Inject } from '@angular/core';
 import { ScientificExamplesService } from 'services/scientificExamples.service';
 import { DialogData } from '../baseDialogService.abstract';
 import { MAT_DIALOG_DATA } from '@angular/material/dialog';


 @Component({
   selector: 'app-scientific-examples-dialog',
   templateUrl: './scientificExamplesDialog.component.html',
   styleUrls: ['./scientificExamplesDialog.component.scss'],
 })
 export class ScientificExamplesDialogComponent implements OnInit {
   examples: Examples[];
   selectedExample: Examples;
   title = 'ECV Use Cases';
   constructor(
    @Inject(MAT_DIALOG_DATA) public data: DialogData<scientificExamplesDataType, boolean>,
     private scientificExamplesService: ScientificExamplesService,
   ) {
   }

   ngOnInit(): void {
      this.scientificExamplesService.examples$.subscribe({
        next: (examplesData: Examples[]) => {
          this.examples= examplesData;
           // Set the first example as the default selected example if data exists
      if (this.examples.length > 0) {
        this.selectedExample = this.examples[0];
      }
        },
        error: (error) => {
          console.error('Error fetching scientific examples:', error);
        },
      });
    }
   selectExample(example: Examples): void {
    this.selectedExample = example;
  }
 }

 export interface Examples {
  example: string;
  title: string;
  description: string;
  listOfServices: string[];
  sharingLinkUrl: string;
}

export interface scientificExamplesDataType {
  confirmButtonHtml: string;
  confirmButtonCssClass: string;
}
