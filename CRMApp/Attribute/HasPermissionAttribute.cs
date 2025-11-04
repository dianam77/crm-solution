using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using Microsoft.EntityFrameworkCore;
using CRMApp.Data;
using CRMApp.Models;
using Microsoft.AspNetCore.Identity;
using System;
using System.Linq;
using System.Threading.Tasks;

[AttributeUsage(AttributeTargets.Method | AttributeTargets.Class, AllowMultiple = true)]
public class HasPermissionAttribute : Attribute, IAsyncActionFilter
{
    private readonly string _permission;

    public HasPermissionAttribute(string permission)
    {
        _permission = permission;
    }

    public async Task OnActionExecutionAsync(ActionExecutingContext context, ActionExecutionDelegate next)
    {
        var db = context.HttpContext.RequestServices.GetService(typeof(CRMAppDbContext)) as CRMAppDbContext;
        var userManager = context.HttpContext.RequestServices.GetService(typeof(UserManager<ApplicationUser>)) as UserManager<ApplicationUser>;

        if (db == null || userManager == null)
        {
            context.Result = new StatusCodeResult(500);
            return;
        }

        var user = await userManager.GetUserAsync(context.HttpContext.User);
        if (user == null)
        {
            context.Result = new ForbidResult();
            return;
        }

        var action = context.ActionDescriptor.DisplayName?.ToLower();


        if (action != null &&
     (action.Contains("province") || action.Contains("city") ||
      action.Contains("getinvoicepdf") ||
      action.Contains("forgotpassword") || action.Contains("resetpassword") ||
      action.Contains("changemypassword") || action.Contains("getcurrentuser") ||
      action.Contains("login")))  
        {
            await next();
            return;
        }




      
        var roles = await db.UserRoles
            .Where(ur => ur.UserId == user.Id)
            .Select(ur => ur.Role)
            .ToListAsync();

        if (!roles.Any())
        {
            context.Result = new ForbidResult();
            return;
        }

       
        if (roles.Any(r => r.Name == "Admin"))
        {
            await next();
            return;
        }

       
        var hasPermission = await db.RolePermissions
            .Include(rp => rp.Permission)
            .Where(rp => roles.Select(r => r.Id).Contains(rp.RoleId) && rp.Permission.Name == _permission)
            .AnyAsync();

        if (!hasPermission)
        {
            context.Result = new ForbidResult();
            return;
        }

        await next();
    }


}
