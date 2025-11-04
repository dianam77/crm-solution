using CRMApp.Data;
using CRMApp.Models;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using System;
using System.Collections.Generic;
using System.IdentityModel.Tokens.Jwt;
using System.Linq;
using System.Security.Claims;
using System.Text;
using System.Text.Json;

namespace CRMApp.Services
{
    public class TokenService
    {
        private readonly string _key;
        private readonly string _issuer;
        private readonly string _audience;
        private readonly CRMAppDbContext _context;

        public TokenService(IConfiguration config, CRMAppDbContext context)
        {
            _key = config["Jwt:Key"] ?? "SuperSecretKey123456";
            _issuer = config["Jwt:Issuer"] ?? "CRMAppIssuer";
            _audience = config["Jwt:Audience"] ?? "CRMAppClient";
            _context = context;
        }

        public string GenerateToken(ApplicationUser user, IEnumerable<string> roles)
        {
            var finalRoles = roles.ToList();

            if (finalRoles.Contains("Admin"))
                finalRoles = _context.Roles.Select(r => r.Name).ToList();

            var permissions = _context.RolePermissions
                                      .Where(rp => finalRoles.Contains(rp.Role.Name))
                                      .Select(rp => rp.Permission.Name.ToLower())
                                      .Distinct()
                                      .ToList();

            Console.WriteLine($"User: {user.UserName}, Permissions: {string.Join(",", permissions)}");

            var claims = new List<Claim>
            {
                new Claim(ClaimTypes.Name, user.UserName),
                new Claim(ClaimTypes.NameIdentifier, user.Id.ToString())
            };

            claims.AddRange(finalRoles.Select(role => new Claim(ClaimTypes.Role, role)));

            claims.Add(new Claim("permissions", JsonSerializer.Serialize(permissions)));

            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_key));
            var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

            var token = new JwtSecurityToken(
                issuer: _issuer,
                audience: _audience,
                claims: claims,
                expires: DateTime.UtcNow.AddHours(10),
                signingCredentials: creds
            );

            return new JwtSecurityTokenHandler().WriteToken(token);
        }
    }
}
