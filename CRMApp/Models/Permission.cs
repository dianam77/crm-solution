namespace CRMApp.Models
{
    public class Permission
    {
        public Guid Id { get; set; } = Guid.NewGuid();
        public string Name { get; set; } = null!; 
        public string Description { get; set; } = string.Empty;

        public ICollection<RolePermission> RolePermissions { get; set; } = new List<RolePermission>();
    }

}
