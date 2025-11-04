using System;

namespace CRMApp.Models
{
    public class CustomerInteractionCategory
    {
        public int Id { get; set; }

        public int CustomerInteractionId { get; set; }
        public CustomerInteraction CustomerInteraction { get; set; } = null!;

        public Guid CategoryId { get; set; }
        public Category Category { get; set; } = null!;
    }
}
