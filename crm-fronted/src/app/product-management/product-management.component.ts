import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ProductService } from '../services/product.service';
import { CategoryService } from '../services/category.service';
import { Product, ProductType } from '../models/product.model';
import { jwtDecode } from 'jwt-decode';

@Component({
  selector: 'app-product-management',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './product-management.component.html',
  styleUrls: ['./product-management.component.css']
})
export class ProductManagementComponent implements OnInit {

  products: Product[] = [];
  categories: { id: string, name: string }[] = [];

  productForm!: FormGroup;
  editingProductId: string | null = null;
  showProductModal = false;
  selectedProduct: Product | null = null;

  currentImages: File[] = [];
  existingImages: string[] = [];
  currentImagePreviews: string[] = [];
  userPermissions: string[] = [];
  permissions: string[] = [];
  constructor(
    private productService: ProductService,
    private categoryService: CategoryService,
    private fb: FormBuilder
  ) { }

  ngOnInit(): void {
    this.loadProducts();
    this.loadCategories();
    this.loadUserPermissions();
    this.initForm();
  }

  initForm() {
    this.productForm = this.fb.group({
      name: ['', Validators.required],
      description: [''],
      price: [0, Validators.required],
      stockQuantity: [0, Validators.required],
      isActive: [true],
      categoryId: ['', Validators.required],
      type: ['Product', Validators.required] 
    });
  }




  loadUserPermissions() {
    const token = localStorage.getItem('jwtToken');
    if (!token) return;

    try {
      const decoded: any = jwtDecode(token);
      const permsRaw = decoded['permissions'] || '[]';
      this.permissions = JSON.parse(permsRaw).map((p: string) => p.toLowerCase());
      console.log('User Permissions:', this.permissions);
    } catch (err) {
      console.error('JWT decode error:', err);
      this.permissions = [];
    }
  }


  hasPermission(permission: string): boolean {
    return this.permissions.includes(permission.toLowerCase());
  }


  private normalizeProductType(type: string | number | undefined): ProductType {
    if (type === 'Service' || type === 'service' || type === 1) return 'Service';
    return 'Product';
  }

  loadProducts() {
    this.productService.getProducts().subscribe(res => {
      this.products = res.map(p => ({
        ...p,
        description: p.description ?? '',
        stockQuantity: p.stockQuantity ?? 0,
        isActive: p.isActive ?? true,
        images: p.images ?? [],
        type: this.normalizeProductType(p.type)
      }));
    });
  }

  loadCategories() {
    this.categoryService.getCategories().subscribe(res => {
      this.categories = res.map(c => ({ id: c.id, name: c.name }));
    });
  }

  openProductModal() {
    this.editingProductId = null;
    this.productForm.reset({
      name: '',
      description: '',
      price: 0,
      stockQuantity: 0,
      isActive: true,
      categoryId: '',
      type: 'Product'
    });
    this.currentImages = [];
    this.existingImages = [];
    this.currentImagePreviews = [];
    this.showProductModal = true;
  }

  closeProductModal() {
    this.showProductModal = false;
  }

  startEditProduct(product: Product) {
    this.editingProductId = product.id;

    const typeStr: ProductType = this.normalizeProductType(product.type);

    this.productForm.patchValue({
      name: product.name,
      description: product.description ?? '',
      price: product.price ?? 0,
      stockQuantity: product.stockQuantity ?? 0,
      isActive: product.isActive ?? true,
      categoryId: product.category?.id ?? '',
      type: typeStr
    });

    this.existingImages = product.images?.map(i =>
      i.imageUrl ? (i.imageUrl.startsWith('http') ? i.imageUrl : 'https://localhost:44386/' + i.imageUrl) : 'assets/images/no-image.png'
    ) ?? [];

    this.currentImages = [];
    this.currentImagePreviews = [];
    this.showProductModal = true;
  }

  saveProduct() {
    if (!this.productForm.valid) {
 
      const invalidFields = Object.keys(this.productForm.controls)
        .filter(key => this.productForm.controls[key].invalid);

      const fieldNames = invalidFields.map(f => {
        switch (f) {
          case 'name': return 'نام محصول';
          case 'price': return 'قیمت';
          case 'stockQuantity': return 'تعداد موجودی';
          case 'categoryId': return 'دسته‌بندی';
          case 'type': return 'نوع محصول';
          default: return f;
        }
      });

      alert('فیلدهای زیر باید تکمیل شوند:\n' + fieldNames.join('\n'));
      return;
    }

    const value = this.productForm.value;
    const formData = new FormData();
    formData.append('Name', value.name);
    formData.append('Description', value.description);
    formData.append('Price', value.price.toString());
    formData.append('StockQuantity', value.stockQuantity.toString());
    formData.append('IsActive', value.isActive ? 'true' : 'false');
    formData.append('CategoryId', value.categoryId);
    formData.append('Type', value.type);

    this.currentImages.forEach(file => formData.append('Images', file, file.name));
    this.existingImages
      .map(url => url.split('/').pop())
      .forEach(fileName => formData.append('ExistingImagesToKeep', fileName!));

    const request = this.editingProductId
      ? this.productService.updateProduct(this.editingProductId, formData)
      : this.productService.createProduct(formData);

    request.subscribe({
      next: () => {
        this.productForm.reset({
          name: '',
          description: '',
          price: 0,
          stockQuantity: 0,
          isActive: true,
          categoryId: '',
          type: 'Product'
        });
        this.currentImages = [];
        this.currentImagePreviews = [];
        this.existingImages = [];
        this.showProductModal = false;
        this.loadProducts();
      },
      error: (err) => {
        console.error(err);
        alert('خطا در ذخیره محصول');
      }
    });
  }


  deleteProduct(id: string) {
    const product = this.products.find(p => p.id === id);
    if (!product) return;

    if (product.invoiceCount && product.invoiceCount > 0) {
      alert('این محصول در فاکتور استفاده شده و نمی‌تواند حذف شود.');
      return;
    }

    if (!confirm('آیا مطمئن هستید؟')) return;

    this.productService.deleteProduct(id).subscribe({
      next: () => {
        this.products = this.products.filter(p => p.id !== id);
      },
      error: (err) => {
        if (err.status === 400) {
          alert(err.error); 
        } else {
          alert('خطا در حذف محصول');
        }
      }
    });
  }


  openProductDetails(product: Product) {
    this.productService.getProductById(product.id).subscribe(res => {

 
      res.type = this.normalizeProductType(res.type);

      res.images = res.images?.map(img => ({
        ...img,
        imageUrl: img.imageUrl?.startsWith('http') ? img.imageUrl : 'https://localhost:44386/' + img.imageUrl
      })) ?? [];

      this.selectedProduct = res;
    });
  }


  closeProductDetails() {
    this.selectedProduct = null;
  }

  onImageChange(event: any) {
    const files: FileList = event.target.files;
    if (!files) return;

    Array.from(files).forEach(file => {
      if (!['image/png', 'image/jpeg', 'image/jpg'].includes(file.type)) return;

      this.currentImages.push(file);

      const reader = new FileReader();
      reader.onload = (e: any) => this.currentImagePreviews.push(e.target.result);
      reader.readAsDataURL(file);
    });

    event.target.value = '';
  }

  removeNewImage(index: number) {
    this.currentImages.splice(index, 1);
    this.currentImagePreviews.splice(index, 1);
  }

  addImageInput(fileInput: HTMLInputElement) {
    fileInput.click();
  }

  removeExistingImage(index: number) {
    this.existingImages.splice(index, 1);
  }

  getProductImage(product: Product): string {
    if (product.images && product.images.length > 0) {
      return 'https://localhost:44386/' + product.images[0].imageUrl;
    }
    return 'assets/images/no-image.png';
  }

  formatPrice(price: number | undefined | null): string {
    if (!price) return '۰ ریال';
    return `${price.toLocaleString('fa-IR')} ریال`;
  }

  getAllProductImages(): string[] {
    if (!this.selectedProduct?.images || this.selectedProduct.images.length === 0) {
      return ['assets/images/no-image.png'];
    }
    return this.selectedProduct.images.map(img => img.imageUrl!);
  }

  trackByImage(index: number, item: any): string {
    return index.toString();
  }

  getProductTypeLabel(type: ProductType | undefined): string {
    if (!type) return '';
    return type === 'Service' ? 'خدمت' : 'محصول';
  }

}
