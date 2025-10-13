using Microsoft.AspNetCore.Mvc.Rendering;
using System.Collections.Generic;
using System.Text.Json.Serialization;

namespace CRMApp.ViewModels
{
    public class AddressViewModel
    {
        public int AddressId { get; set; }
        public string? FullAddress { get; set; }
        public int ProvinceId { get; set; }
        public int CityId { get; set; }
        public string? PostalCode { get; set; }
        public string? AddressType { get; set; }

        [JsonIgnore]
        public string? ProvinceName { get; set; }

        [JsonIgnore]
        public string? CityName { get; set; }

        [JsonIgnore]
        public IEnumerable<SelectListItem>? Provinces { get; set; }

        [JsonIgnore]
        public IEnumerable<SelectListItem>? Cities { get; set; }
    }
}
