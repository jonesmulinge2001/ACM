import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminManageGroupsService } from '../../services/admin-manage-groups.service';
import { Group, GroupMember } from '../../interfaces';

@Component({
  selector: 'app-manage-groups',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './manage-groups.component.html',
  styleUrls: ['./manage-groups.component.css'],
})
export class ManageGroupsComponent implements OnInit {
  groups: Group[] = [];

  loadingGroups = false;
  loadingMembers = false;

  showMemberPanel = false;

  selectedGroupMembers: GroupMember[] = [];

  selectedGroup: (Group & { members: GroupMember[]; memberCount: number }) | null =
    null;
    // Track which group descriptions are expanded
    expandedGroupIds: Set<string> = new Set();

  constructor(private groupsService: AdminManageGroupsService) {}

  ngOnInit() {
    this.loadGroups();
  }

  toggleDescription(groupId: string) {
    if (this.expandedGroupIds.has(groupId)) {
      this.expandedGroupIds.delete(groupId);
    } else {
      this.expandedGroupIds.add(groupId);
    }
  }

  
  isExpanded(groupId: string) {
    return this.expandedGroupIds.has(groupId);
  }

  truncateDescription(desc: string, words: number = 20) {
    const wordArray = desc.split(' ');
    if (wordArray.length <= words) return desc;
    return wordArray.slice(0, words).join(' ') + '...';
  }

  loadGroups() {
    this.loadingGroups = true;

    this.groupsService.getAllGroups().subscribe({
      next: (res: Group[]) => {
        this.groups = res ?? [];
        this.loadingGroups = false;
      },
      error: (err) => {
        console.error('Error loading groups:', err);
        this.loadingGroups = false;
      },
    });
  }

  // ==========================
  // View Group Members
  // ==========================
  viewGroupMembers(group: Group) {
    this.showMemberPanel = true;
    this.loadingMembers = true;
  
    this.selectedGroup = null;
    this.selectedGroupMembers = [];
  
    this.groupsService.getGroupMembers(group.id).subscribe({
      next: (members: GroupMember[]) => {
        console.log('Members fetched:', members); 
        this.selectedGroupMembers = [...members];
  
        this.selectedGroup = {
          ...group,
          members: [...members],
          memberCount: members.length,
        };
  
        this.loadingMembers = false;
      },
      error: (err) => {
        console.error('Error loading members:', err);
        this.loadingMembers = false;
      },
    });
  }
  
  
  
  closePanel() {
    this.showMemberPanel = false;
    this.selectedGroup = null;
    this.selectedGroupMembers = [];
  }

  deleteGroup(id: string) {
    if (!confirm('Delete this group?')) return;

    this.groupsService.deleteGroup(id).subscribe({
      next: () => this.loadGroups(),
      error: (err) => console.error('Delete error:', err),
    });
  }

  restoreGroup(id: string) {
    this.groupsService.restoreGroup(id).subscribe({
      next: () => this.loadGroups(),
      error: (err) => console.error('Restore error:', err),
    });
  }

  formatDate(dateStr: string | undefined) {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }
}
