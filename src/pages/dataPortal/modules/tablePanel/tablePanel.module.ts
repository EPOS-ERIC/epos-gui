import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSortModule } from '@angular/material/sort';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatTabsModule } from '@angular/material/tabs';
import { ResizableModule } from 'angular-resizable-element';
import { RouterModule } from '@angular/router';
import { MatSelectModule } from '@angular/material/select';
import { TablePanelComponent } from './tablePanel.component';
import { TableDisplayComponent } from './tableDisplay/tableDisplay.component';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';

@NgModule({
  declarations: [
    TablePanelComponent,
    TableDisplayComponent,
  ],
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    MatFormFieldModule,
    MatSortModule,
    MatTableModule,
    MatPaginatorModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatCheckboxModule,
    MatButtonModule,
    MatTooltipModule,
    ResizableModule,
    MatButtonToggleModule,
    MatSelectModule,
    MatIconModule,
    MatTabsModule,
  ],
  exports: [
    TablePanelComponent
  ]
})
export class TablePanelModule { }
