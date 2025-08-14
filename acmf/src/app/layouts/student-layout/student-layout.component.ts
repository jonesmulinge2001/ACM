import { Component } from '@angular/core';
import { SidebarComponent } from "../../components/sidebar/sidebar.component";
import { NavbarComponent } from "../../components/navbar/navbar.component";
import { RouterModule } from "@angular/router";

@Component({
  selector: 'app-student-layout',
  imports: [SidebarComponent, NavbarComponent, RouterModule],
  templateUrl: './student-layout.component.html',
  styleUrl: './student-layout.component.css'
})
export class StudentLayoutComponent {

}
