using System.ComponentModel.DataAnnotations;

namespace CRMApp.DTOs
{
    public class LoginDto
    {
        [Required(ErrorMessage = "نام کاربری الزامی است")]
        public string Username { get; set; }

        [Required(ErrorMessage = "رمز عبور الزامی است")]
        [DataType(DataType.Password)]
        public string Password { get; set; }
    }

}
