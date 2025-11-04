using System;
using System.Collections.Generic;

namespace CRMApp.Models
{
    public class Category
    {
        public Guid Id { get; set; } = Guid.NewGuid();
        public string Name { get; set; } = string.Empty;
        public bool IsActive { get; set; } = true;


        public ICollection<Product>? Products { get; set; }
    }
}
