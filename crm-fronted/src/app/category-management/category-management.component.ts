import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CategoryService } from '../services/category.service';
import { Category } from '../models/category.model';
import { jwtDecode } from 'jwt-decode';

@Component({
  selector: 'app-category-management',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './category-management.component.html',
  styleUrls: ['./category-management.component.css']
})
export class CategoryManagementComponent implements OnInit {

  categories: Category[] = [];
  categoryForm!: FormGroup;
  editingCategoryId: string | null = null;
  showCategoryModal = false;

  constructor(private categoryService: CategoryService, private fb: FormBuilder) { }

  ngOnInit(): void {
    this.loadCategories();
    this.initForm();
  }

  initForm() {
    this.categoryForm = this.fb.group({
      name: ['', Validators.required]
    });
  }

  loadCategories() {
    this.categoryService.getCategories().subscribe(res => {
      this.categories = res ?? [];
    });
  }

  openCategoryModal() {
    this.editingCategoryId = null;
    this.categoryForm.reset({ name: '' });
    this.showCategoryModal = true;
  }

  closeCategoryModal() {
    this.showCategoryModal = false;
  }

  startEditCategory(category: Category) {
    this.editingCategoryId = category.id;
    this.categoryForm.patchValue({ name: category.name });
    this.showCategoryModal = true;
  }
  hasPermission(permission: string): boolean {
    const token = localStorage.getItem('jwtToken');
    if (!token) return false;

    try {
      const decoded: any = jwtDecode(token);

      const permsRaw = decoded['permissions'] || '[]';
      const userPermissions: string[] = JSON.parse(permsRaw).map((p: string) => p.toLowerCase());
      return userPermissions.includes(permission.toLowerCase());
    } catch (err) {
      console.error('JWT decode error:', err);
      return false;
    }
  }

  saveCategory() {
    if (!this.categoryForm.valid) return;

    const value = this.categoryForm.value;
    const body = { name: value.name, isActive: true };

    const request = this.editingCategoryId
      ? this.categoryService.updateCategory(this.editingCategoryId, body)
      : this.categoryService.createCategory(body, localStorage.getItem('jwtToken') || '');

    request.subscribe({
      next: () => {
        this.categoryForm.reset();
        this.closeCategoryModal();
        this.loadCategories();
      },
      error: (err) => {
        console.error(err);
        alert('خطا در ذخیره دسته‌بندی');
      }
    });
  }

  deleteCategory(id: string) {
    if (!confirm('آیا مطمئن هستید؟')) return;
    this.categoryService.deleteCategory(id).subscribe(() => {
      this.categories = this.categories.filter(c => c.id !== id);
    });
  }

}
