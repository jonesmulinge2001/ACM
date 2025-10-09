import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { Group } from '../../interfaces';
import { GroupsService } from '../../services/group.service';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-group-list',
  imports: [CommonModule, RouterModule],
  templateUrl: './group-list.component.html',
  styleUrl: './group-list.component.css'
})
export class GroupListComponent implements OnInit{
  groups$!: Observable<Group[]>;
constructor(private svc: GroupsService) {}
  ngOnInit(): void {
    this.groups$ = this.svc.getAllGroups()
  }
}
