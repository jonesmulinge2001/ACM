// manage-users.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminUser } from '../../interfaces';
import { AdminUserService } from '../../services/admin-user.service';
import { FormsModule } from '@angular/forms';

@Component({
  imports: [CommonModule, FormsModule],
  selector: 'app-admin-users',
  templateUrl: './manage-users.component.html',
})
export class ManageUsersComponent implements OnInit {
  users: AdminUser[] = [];
  paginatedUsers: AdminUser[] = []; // only current page
  totalUsers = 0;

  filteredUsers: AdminUser[] = []; // new: filtered list
  searchTerm: string = '';
  Math = Math;

  page = 1;
  limit = 10; // items per page
  loading = false;
  error: string | null = null;

  // Selection state
  selectedUserIds: Set<string> = new Set();
  selectAllChecked = false;

  constructor(private adminUserService: AdminUserService) {}

  ngOnInit(): void {
    this.loadUsers();
  }

  // manage-users.component.ts
  confirmAction: {
    show: boolean;
    message: string;
    onConfirm?: () => void;
  } = { show: false, message: '' };

  openConfirm(message: string, onConfirm: () => void) {
    this.confirmAction = { show: true, message, onConfirm };
  }

  closeConfirm() {
    this.confirmAction.show = false;
    this.confirmAction.message = '';
    this.confirmAction.onConfirm = undefined;
  }

  loadUsers() {
    this.loading = true;
    this.adminUserService.getAllUsers().subscribe({
      next: (data) => {
        this.users = data;
        this.filteredUsers = [...this.users];
        this.totalUsers = this.filteredUsers.length;
        this.setPage(1);
        this.loading = false;
      },
      error: () => {
        this.error = 'Failed to load users';
        this.loading = false;
      },
    });
  }

  onSearch() {
    const term = this.searchTerm.toLowerCase();

    this.filteredUsers = this.users.filter(
      (user) =>
        user.name.toLowerCase().includes(term) ||
        user.email.toLowerCase().includes(term) ||
        user.role.toLowerCase().includes(term) ||
        user.profile.institution.toLowerCase().includes(term)
    );

    this.totalUsers = this.filteredUsers.length;
    this.setPage(1); // reset to page 1 after filtering
  }

  setPage(page: number) {
    if (page < 1 || page > this.totalPages) return;
    this.page = page;

    const start = (this.page - 1) * this.limit;
    const end = start + this.limit;

    this.paginatedUsers = this.filteredUsers.slice(start, end); // use filteredUsers
  }

  get totalPages() {
    return Math.ceil(this.totalUsers / this.limit);
  }

  toggleUserSelection(userId: string) {
    if (this.selectedUserIds.has(userId)) {
      this.selectedUserIds.delete(userId);
    } else {
      this.selectedUserIds.add(userId);
    }
  }

  toggleSelectAll() {
    this.selectAllChecked = !this.selectAllChecked;
    if (this.selectAllChecked) {
      this.paginatedUsers.forEach((u) => this.selectedUserIds.add(u.id));
    } else {
      this.paginatedUsers.forEach((u) => this.selectedUserIds.delete(u.id));
    }
  }

  // Bulk actions
  suspendSelected() {
    const ids = Array.from(this.selectedUserIds);
    if (ids.length === 0) return;

    this.openConfirm(`Suspend ${ids.length} users?`, () => {
      this.adminUserService.massSuspend(ids).subscribe(() => {
        this.users.forEach((u) => {
          if (this.selectedUserIds.has(u.id)) u.status = 'SUSPENDED';
        });
        this.clearSelection();
        
      });
      this.closeConfirm();
    });
  }

  restoreSelected() {
    const ids = Array.from(this.selectedUserIds);
    if (ids.length === 0) return;

    this.openConfirm(`Restore ${ids.length} users?`, () => {
      this.adminUserService.massRestore(ids).subscribe(() => {
        this.users.forEach((u) => {
          if (this.selectedUserIds.has(u.id)) u.status = 'ACTIVE';
        });
        this.clearSelection();
        this.closeConfirm();
      });
    });
  }

  deleteSelected() {
    const ids = Array.from(this.selectedUserIds);
    this.openConfirm(`Delete ${ids.length} users?`, () => {
      this.adminUserService.deleteUsers(ids).subscribe(() => {
        this.users = this.users.filter((u) => !this.selectedUserIds.has(u.id));
        this.clearSelection();
        this.refreshPagination();
        this.closeConfirm();
      });
    });
  }

  clearSelection() {
    this.selectedUserIds.clear();
    this.selectAllChecked = false;
  }

  // Per-user actions
  suspendUser(user: AdminUser) {
    this.openConfirm(`Suspend ${user.name}?`, () => {
      this.adminUserService.suspendUser(user.id).subscribe(() => {
        user.status = 'SUSPENDED';
        this.refreshPagination();
        this.closeConfirm();
      });
    });
  }

  // restore suspended user
  restoreUser(user: AdminUser) {
    this.openConfirm(`Restore ${user.name}?`, () => {
      this.adminUserService.restoreUser(user.id).subscribe(() => {
        user.status = 'ACTIVE';
        this.refreshPagination();
        
      });
      this.closeConfirm();
    });
  }

  deleteUser(user: AdminUser) {
    this.openConfirm(`Delete ${user.name}?`, () => {
      this.adminUserService.deleteUser(user.id).subscribe(() => {
        this.users = this.users.filter((u) => u.id !== user.id);
        this.refreshPagination();
        this.closeConfirm();
      });
    });
  }

  getPaginationRange(): Array<number | '...'> {
    const total = this.totalPages;
    const range: Array<number | '...'> = [];

    if (total <= 7) {
      for (let i = 1; i <= total; i++) range.push(i);
    } else {
      range.push(1);
      if (this.page > 4) range.push('...');
      for (
        let i = Math.max(2, this.page - 1);
        i <= Math.min(total - 1, this.page + 1);
        i++
      ) {
        range.push(i);
      }
      if (this.page < total - 3) range.push('...');
      range.push(total);
    }

    return range;
  }

  refreshPagination() {
    this.totalUsers = this.users.length;
    this.setPage(this.page > this.totalPages ? this.totalPages : this.page);
  }
}
