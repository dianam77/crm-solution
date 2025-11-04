using CRMApp.Controllers;
using CRMApp.Controllers.Api;
using CRMApp.Data;
using CRMApp.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Reflection;
using System.Text.Json;
using System.Threading.Tasks;

namespace CRMApp.Services
{
    public class SeedService
    {
        private readonly CRMAppDbContext _context;
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly RoleManager<ApplicationRole> _roleManager;

        public SeedService(
            CRMAppDbContext context,
            UserManager<ApplicationUser> userManager,
            RoleManager<ApplicationRole> roleManager)
        {
            _context = context;
            _userManager = userManager;
            _roleManager = roleManager;
        }

        public async Task SeedAllAsync(string provincesJsonFilePath)
        {
            Console.WriteLine(">>> SeedAllAsync started <<<");

            await SeedRolesAsync();
            await SeedAdminUserAsync();
            await SeedPermissionsAsync();
            await SeedProvincesAndCitiesFromJsonAsync(provincesJsonFilePath);

            Console.WriteLine(">>> SeedAllAsync finished <<<");
            Console.WriteLine($"✅ Roles: {_context.Roles.Count()}, Users: {_context.Users.Count()}, Permissions: {_context.Permissions.Count()}");
            Console.WriteLine($"✅ Provinces: {_context.Provinces.Count()}, Cities: {_context.Cities.Count()}");
        }

        private async Task SeedRolesAsync()
        {
            Console.WriteLine("Seeding Roles started");
            var roles = new[] { "Admin" };

            foreach (var roleName in roles)
            {
                if (!await _roleManager.RoleExistsAsync(roleName))
                {
                    var role = new ApplicationRole { Name = roleName };
                    var result = await _roleManager.CreateAsync(role);
                    if (result.Succeeded)
                        Console.WriteLine($"✅ Role '{roleName}' created.");
                    else
                        Console.WriteLine($"❌ Failed to create role '{roleName}': {string.Join(", ", result.Errors.Select(e => e.Description))}");
                }
            }

            Console.WriteLine("Seeding Roles finished");
        }

        private async Task SeedAdminUserAsync()
        {
            Console.WriteLine("Seeding Admin user started");

            var adminUser = await _userManager.FindByNameAsync("admin");
            if (adminUser != null)
            {
                Console.WriteLine("✅ Admin user already exists");
                return;
            }

            adminUser = new ApplicationUser
            {
                UserName = "admin",
                NormalizedUserName = "ADMIN",
                Email = "admin@example.com",
                NormalizedEmail = "ADMIN@EXAMPLE.COM",
                EmailConfirmed = true
            };

            var result = await _userManager.CreateAsync(adminUser, "Admin@123");
            if (!result.Succeeded)
            {
                Console.WriteLine($"❌ Failed to create admin user: {string.Join(", ", result.Errors.Select(e => e.Description))}");
                return;
            }

            var addRoleResult = await _userManager.AddToRoleAsync(adminUser, "Admin");
            if (addRoleResult.Succeeded)
                Console.WriteLine("✅ Admin user created and assigned to Admin role.");
            else
                Console.WriteLine($"❌ Failed to assign Admin role: {string.Join(", ", addRoleResult.Errors.Select(e => e.Description))}");
        }

        private async Task SeedPermissionsAsync()
        {
            Console.WriteLine("Seeding Permissions started");

            var controllerTypes = new[]
            {
                typeof(CategoriesController),
                typeof(ChatMessagesController),
                typeof(CustomerCompanyApiController),
                typeof(CustomerIndividualApiController),
                typeof(CustomerInteractionController),
                typeof(HomeController),
                typeof(InvoiceController),
                typeof(MainCompanyController),
                typeof(ProductsController),
                typeof(UserReferralController),
                typeof(UsersController),
                typeof(SmtpSettingsController)
            };

            
            var ignoredActions = new[]
{
    "CustomerIndividualApi.GetProvinces",
    "CustomerIndividualApi.GetCities",
    "Invoice.GetInvoicePdf",
    "Home.ResetPassword",
    "Home.ForgotPassword",
    "Users.GetCurrentUser",
    "Users.ChangeMyPassword",
    "Home.Login"  
};



            var permissions = new List<Permission>();

            foreach (var controller in controllerTypes)
            {
                var actions = controller.GetMethods(BindingFlags.Instance | BindingFlags.Public | BindingFlags.DeclaredOnly)
                                        .Where(m => !m.IsDefined(typeof(Microsoft.AspNetCore.Mvc.NonActionAttribute)));

                foreach (var action in actions)
                {
                    var permName = $"{controller.Name.Replace("Controller", "")}.{action.Name}";

                    if (ignoredActions.Contains(permName, StringComparer.OrdinalIgnoreCase))
                        continue;

                    if (!_context.Permissions.Any(p => p.Name == permName))
                    {
                        permissions.Add(new Permission
                        {
                            Name = permName,
                            Description = $"دسترسی به {permName}"
                        });
                    }
                }
            }

            if (permissions.Any())
            {
                await _context.Permissions.AddRangeAsync(permissions);
                await _context.SaveChangesAsync();
                Console.WriteLine($"✅ {permissions.Count} permissions added.");
            }

       
            var adminRole = await _roleManager.FindByNameAsync("Admin");
            if (adminRole != null)
            {
                var existingRolePerms = _context.RolePermissions
                                                .Where(rp => rp.RoleId == adminRole.Id)
                                                .Select(rp => rp.PermissionId)
                                                .ToList();

                var missingPerms = _context.Permissions
                    .Where(p => !existingRolePerms.Contains(p.Id))
                    .Select(p => new RolePermission
                    {
                        RoleId = adminRole.Id,
                        PermissionId = p.Id
                    })
                    .ToList();

                if (missingPerms.Any())
                {
                    _context.RolePermissions.AddRange(missingPerms);
                    await _context.SaveChangesAsync();
                }
            }

            Console.WriteLine("✅ Permissions seeding finished");
        }

        private async Task SeedProvincesAndCitiesFromJsonAsync(string jsonFilePath)
        {
            Console.WriteLine("Seeding Provinces & Cities from JSON started");

            if (!File.Exists(jsonFilePath))
            {
                Console.WriteLine($"❌ JSON file not found: {jsonFilePath}");
                return;
            }

            var jsonString = await File.ReadAllTextAsync(jsonFilePath);
            ProvincesRootModel? provincesRoot = null;

            try
            {
                provincesRoot = JsonSerializer.Deserialize<ProvincesRootModel>(jsonString, new JsonSerializerOptions
                {
                    PropertyNameCaseInsensitive = true
                });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"❌ Failed to deserialize JSON: {ex}");
                return;
            }

            if (provincesRoot?.Provinces == null || !provincesRoot.Provinces.Any())
            {
                Console.WriteLine("❌ No province data found in JSON.");
                return;
            }

            var provinces = new List<Province>();
            foreach (var p in provincesRoot.Provinces)
            {
                if (string.IsNullOrWhiteSpace(p.ProvinceName)) continue;

                var province = new Province
                {
                    Name = p.ProvinceName,
                    Cities = p.Cities?.Where(c => !string.IsNullOrWhiteSpace(c.CityName))
                                      .Select(c => new City { Name = c.CityName })
                                      .ToList() ?? new List<City>()
                };

                provinces.Add(province);
            }

 
            var existingProvinces = _context.Provinces.Include(p => p.Cities).ToList();
            _context.Cities.RemoveRange(existingProvinces.SelectMany(p => p.Cities));
            _context.Provinces.RemoveRange(existingProvinces);
            await _context.SaveChangesAsync();

            await _context.Provinces.AddRangeAsync(provinces);
            await _context.SaveChangesAsync();

            Console.WriteLine("✅ Provinces & Cities seeded from JSON");
        }


        public class ProvinceJsonModel
        {
            public int ProvinceId { get; set; }
            public string ProvinceName { get; set; } = string.Empty;
            public List<CityJsonModel> Cities { get; set; } = new();
        }

        public class CityJsonModel
        {
            public int CityId { get; set; }
            public string CityName { get; set; } = string.Empty;
        }

        public class ProvincesRootModel
        {
            public List<ProvinceJsonModel> Provinces { get; set; } = new();
        }
    }
}

