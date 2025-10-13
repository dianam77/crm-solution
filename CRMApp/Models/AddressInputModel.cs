namespace CRMApp.Models
{
    public class AddressInputModel
    {
        public string FullAddress { get; set; }
        public int ProvinceId { get; set; }
        public int CityId { get; set; }
        public string PostalCode { get; set; }
        public string AddressType { get; set; }
    }
}
