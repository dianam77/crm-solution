using CRMApp.Constants;
using CRMApp.Data;
using CRMApp.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text.Json;
using System.Threading.Tasks;

namespace CRMApp.Services
{
    public class ProvinceJsonModel
    {
        public int ProvinceId { get; set; }
        public string ProvinceName { get; set; }
        public List<CityJsonModel> Cities { get; set; }
    }

    public class CityJsonModel
    {
        public int CityId { get; set; }
        public string CityName { get; set; }
    }

    public class ProvincesRootModel
    {
        public List<ProvinceJsonModel> Provinces { get; set; }
    }

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
            await SeedProvincesAndCitiesFromJsonAsync(provincesJsonFilePath);

            var roleCount = await _context.Roles.CountAsync();
            var userCount = await _context.Users.CountAsync();
            var provinceCount = await _context.Provinces.CountAsync();
            var cityCount = await _context.Cities.CountAsync();

            Console.WriteLine($"✅ Roles in DB: {roleCount}, Users in DB: {userCount}");
            Console.WriteLine($"✅ Provinces in DB: {provinceCount}, Cities in DB: {cityCount}");

            Console.WriteLine(">>> Seeding Finished <<<");
        }

        private async Task SeedRolesAsync()
        {
            Console.WriteLine("Seeding Roles started");
            var roles = new[] { RoleNames.Admin, RoleNames.Manager, RoleNames.User };

            foreach (var roleName in roles)
            {
                Console.WriteLine($"Checking role: {roleName}");
                if (!await _roleManager.RoleExistsAsync(roleName))
                {
                    var role = new ApplicationRole
                    {
                        Name = roleName,
                        NormalizedName = roleName.ToUpper()
                    };
                    var result = await _roleManager.CreateAsync(role);
                    if (!result.Succeeded)
                    {
                        Console.WriteLine($"❌ Failed to create role '{roleName}': {string.Join(", ", result.Errors.Select(e => e.Description))}");
                    }
                    else
                    {
                        Console.WriteLine($"✅ Role '{roleName}' created.");
                    }
                }
                else
                {
                    Console.WriteLine($"ℹ️ Role '{roleName}' already exists.");
                }
            }
            Console.WriteLine("Seeding Roles finished");
        }

        private async Task SeedAdminUserAsync()
        {
            Console.WriteLine("Seeding Admin user started");

            var adminUser = await _userManager.FindByNameAsync("admin");

            if (adminUser == null)
            {
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
                Console.WriteLine("✅ Admin user created.");

                var roleResult = await _userManager.AddToRoleAsync(adminUser, RoleNames.Admin);
                if (!roleResult.Succeeded)
                {
                    Console.WriteLine($"❌ Failed to assign admin role: {string.Join(", ", roleResult.Errors.Select(e => e.Description))}");
                }
                else
                {
                    Console.WriteLine("✅ Admin role assigned to admin user.");
                }
            }
            else
            {
                Console.WriteLine("ℹ️ Admin user already exists.");
            }
            Console.WriteLine("Seeding Admin user finished");
        }

        private async Task SeedProvincesAndCitiesFromJsonAsync(string jsonFilePath)
        {
            Console.WriteLine(">>> Seeding Provinces and Cities from JSON started <<<");

            // Remove this check for initial testing to force seeding every time
            // if (await _context.Provinces.AnyAsync())
            // {
            //     Console.WriteLine("ℹ️ Provinces already seeded.");
            //     return;
            // }

            if (!File.Exists(jsonFilePath))
            {
                Console.WriteLine($"❌ JSON file not found: {jsonFilePath}");
                return;
            }
            else
            {
                Console.WriteLine($"✅ JSON file found: {jsonFilePath}");
            }

            var jsonString = await File.ReadAllTextAsync(jsonFilePath);

            var options = new JsonSerializerOptions
            {
                PropertyNameCaseInsensitive = true
            };

            ProvincesRootModel provincesRoot = null;

            try
            {
                provincesRoot = JsonSerializer.Deserialize<ProvincesRootModel>(jsonString, options);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"❌ JSON Deserialization failed: {ex.Message}");
                return;
            }

            if (provincesRoot?.Provinces == null || provincesRoot.Provinces.Count == 0)
            {
                Console.WriteLine("❌ No province data found in JSON.");
                return;
            }

            Console.WriteLine($"✅ JSON provinces count: {provincesRoot.Provinces.Count}");

            var provinces = new List<Province>();

            foreach (var p in provincesRoot.Provinces)
            {
                var province = new Province
                {
                    Name = p.ProvinceName,
                    Cities = new List<City>()
                };

                Console.WriteLine($"Adding province: {p.ProvinceName} with {p.Cities?.Count ?? 0} cities.");

                if (p.Cities != null)
                {
                    foreach (var c in p.Cities)
                    {
                        province.Cities.Add(new City
                        {
                            Name = c.CityName
                        });
                    }
                }

                provinces.Add(province);
            }

            var existingProvinces = _context.Provinces.Include(p => p.Cities);
            _context.Cities.RemoveRange(existingProvinces.SelectMany(p => p.Cities));
            _context.Provinces.RemoveRange(existingProvinces);
            await _context.SaveChangesAsync();

            await _context.Provinces.AddRangeAsync(provinces);
            await _context.SaveChangesAsync();

            Console.WriteLine("✅ Provinces and Cities seeding finished from JSON.");
        }
    }
}
