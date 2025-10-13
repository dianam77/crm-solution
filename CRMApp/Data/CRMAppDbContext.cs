using CRMApp.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using System;

namespace CRMApp.Data
{
    public class CRMAppDbContext : IdentityDbContext<ApplicationUser, ApplicationRole, Guid,
        IdentityUserClaim<Guid>, UserRole, IdentityUserLogin<Guid>,
        IdentityRoleClaim<Guid>, IdentityUserToken<Guid>>
    {
        public CRMAppDbContext(DbContextOptions<CRMAppDbContext> options) : base(options) { }

        // ---------- مشتریان ----------
        public DbSet<CustomerIndividual> CustomerIndividuals { get; set; }
        public DbSet<CustomerCompany> CustomerCompanies { get; set; }
        public DbSet<Address> Addresses { get; set; }
        public DbSet<Province> Provinces { get; set; }
        public DbSet<City> Cities { get; set; }
        public DbSet<ContactPhone> ContactPhones { get; set; }
        public DbSet<Email> Emails { get; set; }
        public DbSet<CustomerCompanyRelation> CustomerCompanyRelations { get; set; }
        public DbSet<CustomerInteraction> CustomerInteractions { get; set; }
        public DbSet<CustomerInteractionAttachment> CustomerInteractionAttachments { get; set; }

        // ---------- ارجاعات ----------
        public DbSet<UserReferral> UserReferrals { get; set; }

        // ---------- پیام‌رسان ----------
        public DbSet<ChatMessage> ChatMessages { get; set; }
        public DbSet<ChatConversation> ChatConversations { get; set; }
        public DbSet<ChatConversationParticipant> ChatConversationParticipants { get; set; }
        public DbSet<ChatMessageRecipient> ChatMessageRecipients { get; set; }

        // ---------- محصولات ----------
        public DbSet<Product> Products { get; set; }
        public DbSet<Category> Categories { get; set; }
        public DbSet<ProductImage> ProductImages { get; set; }

        // ---------- فاکتور و پیش فاکتور ----------
        public DbSet<Invoice> Invoices { get; set; }
        public DbSet<InvoiceItem> InvoiceItems { get; set; }
        public DbSet<InvoiceAttachment> InvoiceAttachments { get; set; }


        // ---------- شرکت اصلی ----------
        public DbSet<MainCompany> MainCompanies { get; set; }
        public DbSet<CompanyWebsite> CompanyWebsites { get; set; }


        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // ---------- UserRole ----------
            modelBuilder.Entity<UserRole>()
                .HasKey(ur => new { ur.UserId, ur.RoleId });

            modelBuilder.Entity<UserRole>()
                .HasOne(ur => ur.User)
                .WithMany(u => u.UserRoles)
                .HasForeignKey(ur => ur.UserId)
                .IsRequired();

            modelBuilder.Entity<UserRole>()
                .HasOne(ur => ur.Role)
                .WithMany(r => r.UserRoles)
                .HasForeignKey(ur => ur.RoleId)
                .IsRequired();

            // ---------- مشتریان ----------
            modelBuilder.Entity<CustomerIndividual>().HasKey(ci => ci.CustomerId);
            modelBuilder.Entity<CustomerCompany>().HasKey(cc => cc.CustomerId);
            modelBuilder.Entity<Address>().HasKey(a => a.AddressId);
            modelBuilder.Entity<ContactPhone>().HasKey(cp => cp.PhoneId);
            modelBuilder.Entity<Email>().HasKey(e => e.EmailId);
            modelBuilder.Entity<CustomerCompanyRelation>().HasKey(r => r.RelationId);
            modelBuilder.Entity<CustomerInteraction>().HasKey(ci => ci.Id);
            modelBuilder.Entity<CustomerInteractionAttachment>().HasKey(a => a.Id);

            modelBuilder.Entity<CustomerCompanyRelation>()
                .HasOne(r => r.IndividualCustomer)
                .WithMany(i => i.CustomerCompanyRelations)
                .HasForeignKey(r => r.IndividualCustomerId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<CustomerCompanyRelation>()
                .HasOne(r => r.CompanyCustomer)
                .WithMany(c => c.CustomerCompanyRelations)
                .HasForeignKey(r => r.CompanyCustomerId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<Address>()
                .HasOne(a => a.IndividualCustomer)
                .WithMany(i => i.Addresses)
                .HasForeignKey(a => a.IndividualCustomerId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<Address>()
                .HasOne(a => a.CompanyCustomer)
                .WithMany(c => c.Addresses)
                .HasForeignKey(a => a.CompanyCustomerId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<Address>()
                .HasOne(a => a.Province)
                .WithMany()
                .HasForeignKey(a => a.ProvinceId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<Address>()
                .HasOne(a => a.City)
                .WithMany()
                .HasForeignKey(a => a.CityId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<ContactPhone>()
                .HasOne(cp => cp.IndividualCustomer)
                .WithMany(i => i.ContactPhones)
                .HasForeignKey(cp => cp.IndividualCustomerId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<ContactPhone>()
                .HasOne(cp => cp.CompanyCustomer)
                .WithMany(c => c.ContactPhones)
                .HasForeignKey(cp => cp.CompanyCustomerId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<Email>()
                .HasOne(e => e.IndividualCustomer)
                .WithMany(i => i.Emails)
                .HasForeignKey(e => e.IndividualCustomerId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<Email>()
                .HasOne(e => e.CompanyCustomer)
                .WithMany(c => c.Emails)
                .HasForeignKey(e => e.CompanyCustomerId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<CustomerInteractionAttachment>()
                .HasOne(a => a.CustomerInteraction)
                .WithMany(c => c.Attachments)
                .HasForeignKey(a => a.CustomerInteractionId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<CustomerIndividual>()
                .HasIndex(c => c.NationalCode)
                .IsUnique()
                .HasFilter("[NationalCode] IS NOT NULL");

            // ---------- ارجاعات ----------
            modelBuilder.Entity<UserReferral>()
                .HasOne(r => r.AssignedBy)
                .WithMany()
                .HasForeignKey(r => r.AssignedById)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<UserReferral>()
                .HasOne(r => r.AssignedTo)
                .WithMany()
                .HasForeignKey(r => r.AssignedToId)
                .OnDelete(DeleteBehavior.Restrict);

            // ---------- پیام‌رسان ----------
            modelBuilder.Entity<ChatMessage>()
                .HasOne(m => m.Sender)
                .WithMany(u => u.SentMessages)
                .HasForeignKey(m => m.SenderId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<ChatMessage>()
                .HasOne(m => m.Conversation)
                .WithMany(c => c.Messages)
                .HasForeignKey(m => m.ConversationId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<ChatMessageRecipient>()
                .HasOne(r => r.ChatMessage)
                .WithMany(m => m.Recipients)
                .HasForeignKey(r => r.ChatMessageId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<ChatMessageRecipient>()
                .HasOne(r => r.User)
                .WithMany(u => u.ReceivedMessages)
                .HasForeignKey(r => r.UserId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<ChatConversationParticipant>()
                .HasOne(p => p.Conversation)
                .WithMany(c => c.Participants)
                .HasForeignKey(p => p.ConversationId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<ChatConversationParticipant>()
                .HasOne(p => p.User)
                .WithMany(u => u.Conversations)
                .HasForeignKey(p => p.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            // ---------- Category & Product ----------
            modelBuilder.Entity<Product>()
                .HasOne(p => p.Category)
                .WithMany(c => c.Products)
                .HasForeignKey(p => p.CategoryId)
                .OnDelete(DeleteBehavior.SetNull);

            modelBuilder.Entity<ProductImage>()
                .HasOne(pi => pi.Product)
                .WithMany(p => p.Images)
                .HasForeignKey(pi => pi.ProductId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<Product>()
                .HasIndex(p => p.SKU)
                .IsUnique()
                .HasFilter("[SKU] IS NOT NULL");

            modelBuilder.Entity<Category>()
                .HasIndex(c => c.Name)
                .IsUnique();

            modelBuilder.Entity<ProductImage>()
                .HasIndex(pi => new { pi.ProductId, pi.ImageUrl })
                .IsUnique();

            // ---------- Invoice ----------
            modelBuilder.Entity<Invoice>(entity =>
            {
                entity.HasKey(i => i.Id);

                entity.HasOne(i => i.CustomerIndividual)
                      .WithMany()
                      .HasForeignKey(i => i.CustomerIndividualId)
                      .OnDelete(DeleteBehavior.Restrict);

                entity.HasOne(i => i.CustomerCompany)
                      .WithMany()
                      .HasForeignKey(i => i.CustomerCompanyId)
                      .OnDelete(DeleteBehavior.Restrict);

                entity.HasOne(i => i.CreatedByUser)
                      .WithMany()
                      .HasForeignKey(i => i.CreatedByUserId)
                      .OnDelete(DeleteBehavior.Restrict);

                entity.HasIndex(i => i.InvoiceNumber)
                      .IsUnique();
            });

            // ---------- InvoiceItem ----------
            modelBuilder.Entity<InvoiceItem>(entity =>
            {
                entity.HasKey(ii => ii.Id);

                entity.HasOne(ii => ii.Invoice)
                      .WithMany(i => i.InvoiceItems)
                      .HasForeignKey(ii => ii.InvoiceId)
                      .OnDelete(DeleteBehavior.Cascade);

                entity.HasOne(ii => ii.Product)
                      .WithMany()
                      .HasForeignKey(ii => ii.ProductId)
                      .OnDelete(DeleteBehavior.Restrict);
            });

            // ---------- InvoiceAttachment ----------
            modelBuilder.Entity<InvoiceAttachment>(entity =>
            {
                entity.HasKey(a => a.Id);

                entity.HasOne(a => a.Invoice)
                      .WithMany(i => i.Attachments)
                      .HasForeignKey(a => a.InvoiceId)
                      .OnDelete(DeleteBehavior.Cascade);

                entity.Property(a => a.FileName)
                      .IsRequired()
                      .HasMaxLength(255);

                entity.Property(a => a.FilePath)
                      .IsRequired()
                      .HasMaxLength(500);
            });

            // ---------- CompanyWebsite ----------
            modelBuilder.Entity<CompanyWebsite>()
                .HasKey(w => w.WebsiteId);   // ← کلید اصلی

            // ---------- MainCompany ----------
            modelBuilder.Entity<MainCompany>()
     .HasKey(mc => mc.MainCompanyId);

            modelBuilder.Entity<MainCompany>()
                .HasMany(mc => mc.Emails)
                .WithOne(e => e.MainCompany)
                .HasForeignKey(e => e.MainCompanyId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<MainCompany>()
                .HasMany(mc => mc.ContactPhones) // ← اصلاح شد
                .WithOne(p => p.MainCompany)
                .HasForeignKey(p => p.MainCompanyId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<MainCompany>()
                .HasMany(mc => mc.Addresses)
                .WithOne(a => a.MainCompany)
                .HasForeignKey(a => a.MainCompanyId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<MainCompany>()
                .HasMany(mc => mc.Websites)
                .WithOne(w => w.MainCompany)
                .HasForeignKey(w => w.MainCompanyId)
                .OnDelete(DeleteBehavior.Cascade);


        }
    }
}
