namespace CRMApp.ViewModels
{
    public class UserEditViewModel
    {
        public string Id { get; set; } = string.Empty;
        public string UserName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;

        public string? FirstName { get; set; }
        public string? LastName { get; set; }

        public string? Role { get; set; }
        public string? Password { get; set; }

        public bool IsActive { get; set; } = true;
    }
}
