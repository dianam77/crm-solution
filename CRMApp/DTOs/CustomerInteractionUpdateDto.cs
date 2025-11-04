using Newtonsoft.Json;

public class CustomerInteractionAttachmentDto
{
    public string FilePath { get; set; } = null!;
    public string OriginalName { get; set; } = null!;
}

public class CustomerInteractionUpdateDto
{
    public int? IndividualCustomerId { get; set; }
    public int? CompanyCustomerId { get; set; }
    public int InteractionType { get; set; }
    public DateTime StartDateTime { get; set; }
    public DateTime? EndDateTime { get; set; }
    public int? DurationMinutes { get; set; }
    public string Subject { get; set; } = null!;
    public string Notes { get; set; } = null!;
    public string? ExistingAttachmentPaths { get; set; } 

    
    public string? CategoryProductGroupsJson { get; set; }

    public List<CategoryProductGroupDto> GetCategoryProductGroups()
    {
        if (string.IsNullOrEmpty(CategoryProductGroupsJson)) return new List<CategoryProductGroupDto>();
        return JsonConvert.DeserializeObject<List<CategoryProductGroupDto>>(CategoryProductGroupsJson)
               ?? new List<CategoryProductGroupDto>();
    }
}

public class CategoryProductGroupDto
{
    public List<string> CategoryIds { get; set; } = new();
    public List<string> ProductIds { get; set; } = new();
}
