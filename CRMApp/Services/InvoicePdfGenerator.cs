using CRMApp.DTOs;
using CRMApp.Models;
using CRMApp.Models.Enums;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;
using System;
using System.Collections.Generic;
using System.Globalization;
using System.IO;
using System.Linq;
using System.Text;
using System.Text.RegularExpressions;

public class InvoicePdfGenerator
{
    private readonly Invoice _invoice;
    private readonly InvoicePrintCustomerInfo _customerInfo;
    private readonly InvoicePrintCompanyInfo _sellerInfo;

    public InvoicePdfGenerator(Invoice invoice, InvoicePrintCustomerInfo customerInfo, InvoicePrintCompanyInfo sellerInfo)
    {
        _invoice = invoice;
        _customerInfo = customerInfo;
        _sellerInfo = sellerInfo;
    }

    public byte[] GeneratePdf()
    {
        using var ms = new MemoryStream();

        string FormatCurrency(decimal value)
        {
            return value == 0 ? "0" : ToPersianNumber(value) + " ریال";
        }

        string ConvertNumbersToLatin(string input)
        {
            return input
                .Replace('۰', '0').Replace('۱', '1').Replace('۲', '2')
                .Replace('۳', '3').Replace('۴', '4').Replace('۵', '5')
                .Replace('۶', '6').Replace('۷', '7').Replace('۸', '8')
                .Replace('۹', '9');
        }

        Document.Create(container =>
        {
            container.Page(page =>
            {
                page.Margin(10); 

                page.DefaultTextStyle(x => x
                    .FontSize(7.5f) 
                    .FontFamily("B Titr")
                    .Fallback(TextStyle.Default.FontFamily("Arial"))
                );

                page.Content().Column(col =>
                {
                    col.Spacing(2.5f); 

             
                    col.Item()
                       .AlignCenter()
                       .Text(GetInvoiceTypeText(_invoice.InvoiceType))
                       .FontSize(12)
                       .SemiBold();
                    col.Item().Scale(0.8f).Column(left =>
                    {
                        left.Spacing(0.5f);
                        left.Item().Text($"فاکتور شماره: {_invoice.InvoiceNumber}").FontSize(7);
                        left.Item().Text($"تاریخ صدور: {ToPersianDate(_invoice.IssueDate)}").FontSize(7);
                        if (_invoice.InvoiceType == InvoiceType.Proforma)
                            left.Item().Text($"تاریخ سررسید: {ToPersianDate(_invoice.DueDate)}").FontSize(7);
                        left.Item().Text($"وضعیت فاکتور: {GetInvoiceStatusText(_invoice.Status)}").FontSize(7);
                    });

                    col.Item()
                       .Border(0.5f)
                       .BorderColor(Colors.Black)
                       .Padding(2)
                       .Column(outerCol =>
                       {
                           outerCol.Spacing(1);

                           string FixNumberOrder(string input) => string.IsNullOrEmpty(input) ? input : new string(input.Reverse().ToArray());
                           string FixTextWithNumbers(string text)
                           {
                               if (string.IsNullOrEmpty(text)) return text;
                               var parts = Regex.Split(text, @"([\d۰-۹]+)");
                               StringBuilder result = new();
                               foreach (var part in parts)
                                   result.Append(Regex.IsMatch(part, @"^[\d۰-۹]+$") ? FixNumberOrder(ConvertNumbersToLatin(part)) : part);
                               return "\u200F" + result.ToString();
                           }

                      
                           outerCol.Item().Column(sellerCol =>
                           {
                               sellerCol.Item().AlignCenter().Text("مشخصات فروشنده").FontSize(8).SemiBold();
                               sellerCol.Item().LineHorizontal(0.5f).LineColor(Colors.Black);
                               sellerCol.Item().Grid(grid =>
                               {
                                   grid.Columns(2);
                                   grid.Item().Column(colRight =>
                                   {
                                       colRight.Item().AlignRight().Text($"شماره ثبت / شناسه ملی: {FixTextWithNumbers(GetSellerRegisterOrNationalId())}").FontSize(7);
                                       colRight.Item().AlignRight().Text($"شهر: {GetSellerCity()}").FontSize(7);
                                       colRight.Item().AlignRight().Text($"کدپستی: {FixTextWithNumbers(GetSellerPostalCode())}").FontSize(7);
                                   });
                                   grid.Item().Column(colLeft =>
                                   {
                                       colLeft.Item().AlignRight().Text($"نام فروشنده: {GetSellerName()}").FontSize(7);
                                       colLeft.Item().AlignRight().Text($"کد اقتصادی: {FixTextWithNumbers(GetSellerEconomicCode())}").FontSize(7);
                                       colLeft.Item().AlignRight().Text($"استان: {GetSellerProvince()}").FontSize(7);
                                       colLeft.Item().Row(row =>
                                       {
                                           row.RelativeItem().AlignRight().Text(FixTextWithNumbers(GetSellerFullAddress())).FontSize(7);
                                           row.ConstantItem(25).AlignRight().Text("نشانی:");
                                       });
                                   });
                               });
                               sellerCol.Item().LineHorizontal(0.5f).LineColor(Colors.Black);
                           });

                     
                           outerCol.Item().AlignCenter().Text("مشخصات مشتری").FontSize(8).SemiBold();
                           outerCol.Item().LineHorizontal(0.5f).LineColor(Colors.Black);
                           outerCol.Item().Grid(grid =>
                           {
                               grid.Columns(2);
                               grid.Item().Column(colRight =>
                               {
                                   colRight.Item().AlignRight().Text($"شماره ثبت / شماره ملی: {FixTextWithNumbers(GetRegisterOrNationalId())}").FontSize(7);
                                   colRight.Item().AlignRight().Text($"شهر: {GetCity()}").FontSize(7);
                                   colRight.Item().AlignRight().Text($"کدپستی: {FixTextWithNumbers(GetPostalCode())}").FontSize(7);
                               });
                               grid.Item().Column(colLeft =>
                               {
                                   colLeft.Item().AlignRight().Text($"نام مشتری: {GetCustomerName()}").FontSize(7);
                                   colLeft.Item().AlignRight().Text($"شماره اقتصادی: {FixTextWithNumbers(GetEconomicCode())}").FontSize(7);
                                   colLeft.Item().AlignRight().Text($"استان: {GetProvince()}").FontSize(7);
                                   colLeft.Item().Row(row =>
                                   {
                                       row.RelativeItem().AlignRight().Text(FixTextWithNumbers(GetFullAddress())).FontSize(7);
                                       row.ConstantItem(25).AlignRight().Text("نشانی:");
                                   });
                               });
                           });
                         
                           outerCol.Item()
                               .PaddingBottom(5) 
                               .LineHorizontal(0.5f)
                               .LineColor(Colors.Black);
                  
                           outerCol.Item().AlignRight().Table(table =>
                           {
                               table.ColumnsDefinition(columns =>
                               {
                                   columns.RelativeColumn(); columns.RelativeColumn(); columns.RelativeColumn();
                                   columns.RelativeColumn(); columns.RelativeColumn(); columns.RelativeColumn();
                                   columns.ConstantColumn(25); columns.RelativeColumn(); columns.ConstantColumn(40);
                               });

                               string[] titles = { "مبلغ کل + مالیات", "مالیات ارزش افزوده", "مبلغ کل بعد از تخفیف", "تخفیف", "مبلغ کل (قبل از تخفیف)", "بهای واحد", "تعداد", "محصول", "ردیف" };
                               foreach (var t in titles)
                                   table.Cell().Border(0.5f).Padding(1).AlignCenter().Text(t).SemiBold().FontSize(7);

                               int rowNumber = 1;
                               foreach (var item in _invoice.InvoiceItems)
                               {
                                   table.Cell().Border(0.5f).Padding(1).AlignRight().Text(FormatCurrency(item.VATAmount)).FontSize(7);
                                   table.Cell().Border(0.5f).Padding(1).AlignRight().Text(FormatCurrency(item.VATAmount)).FontSize(7);
                                   table.Cell().Border(0.5f).Padding(1).AlignRight().Text(FormatCurrency(item.PriceAfterDiscount)).FontSize(7);
                                   table.Cell().Border(0.5f).Padding(1).AlignRight().Text(FormatCurrency(item.Discount)).FontSize(7);
                                   table.Cell().Border(0.5f).Padding(1).AlignRight().Text(FormatCurrency(item.Quantity * item.UnitPrice)).FontSize(7);
                                   table.Cell().Border(0.5f).Padding(1).AlignRight().Text(FormatCurrency(item.UnitPrice)).FontSize(7);
                                   table.Cell().Border(0.5f).Padding(1).AlignCenter().Text(ToPersianNumber(item.Quantity)).FontSize(7);
                                   table.Cell().Border(0.5f).Padding(1).AlignRight().Text(item.Product?.Name ?? "-").FontSize(7);
                                   table.Cell().Border(0.5f).Padding(1).AlignCenter().Text(ToPersianNumber(rowNumber)).FontSize(7);
                                   rowNumber++;
                               }

                               table.Footer(footer =>
                               {
                                   footer.Cell().Border(0.5f).Padding(1).AlignRight().Text(FormatCurrency(_invoice.InvoiceItems.Sum(i => i.FinalPrice))).FontSize(7);
                                   footer.Cell().Border(0.5f).Padding(1).AlignRight().Text(FormatCurrency(_invoice.InvoiceItems.Sum(i => i.VATAmount))).FontSize(7);
                                   footer.Cell().Border(0.5f).Padding(1).AlignRight().Text(FormatCurrency(_invoice.InvoiceItems.Sum(i => i.PriceAfterDiscount))).FontSize(7);
                                   footer.Cell().Border(0.5f).Padding(1).AlignRight().Text(FormatCurrency(_invoice.InvoiceItems.Sum(i => i.Discount))).FontSize(7);
                                   footer.Cell().Border(0.5f).Padding(1).AlignRight().Text(FormatCurrency(_invoice.InvoiceItems.Sum(i => i.Quantity * i.UnitPrice))).FontSize(7);
                                   footer.Cell().Border(0.5f).AlignCenter().Text("-").FontSize(7);
                                   footer.Cell().Border(0.5f).AlignCenter().Text("-").FontSize(7);
                                   footer.Cell().Border(0.5f).AlignCenter().Text("-").FontSize(7);
                                   footer.Cell().Border(0.5f).AlignCenter().Text("-").FontSize(7);
                               });
                           });

                      
                           outerCol.Item().Grid(grid =>
                           {
                               grid.Columns(3);

                               grid.Item().EnsureSpace().Scale(0.85f).Column(col =>
                               {
                                   decimal subtotalAfterDiscount = _invoice.InvoiceItems.Sum(i => (i.Quantity * i.UnitPrice) - i.Discount);
                                   decimal totalTax = _invoice.InvoiceItems.Sum(i => i.VATAmount);
                                   decimal totalWithTax = subtotalAfterDiscount + totalTax;
                                   long total = (long)Math.Round(totalWithTax);

                                   col.Item().AlignRight().Row(row =>
                                   {
                                       row.AutoItem().Text(ToPersianWords(total)).FontSize(7);
                                       row.ConstantItem(3);
                                       row.AutoItem().Text("مبلغ کل به حروف:").FontSize(7).SemiBold();
                                   });
                               });



                               grid.Item().Height(15).AlignCenter().BorderLeft(0.5f).BorderColor(Colors.Black);

                               grid.Item().Column(col =>
                               {
                                   col.Item().Padding(1).Row(row =>
                                   {
                                       
                                       row.ConstantItem(6)
                                           .AlignMiddle()
                                           .Element(e => e
                                               .Height(6)
                                               .Width(6)
                                               .Border(0.5f));

                                   
                                       row.AutoItem()
                                           .AlignMiddle()
                                           .Text("غیرنقدی")
                                           .FontSize(7);

                                     
                                       row.ConstantItem(5);

                                    
                                       row.ConstantItem(6)
                                           .AlignMiddle()
                                           .Element(e => e
                                               .Height(6)
                                               .Width(6)
                                               .Border(0.5f));

                                  
                                       row.AutoItem()
                                           .AlignMiddle()
                                           .Text("نقدی")
                                           .FontSize(7);

                                       row.AutoItem()
                                           .AlignMiddle()
                                           .Text("شرایط فروش:")
                                           .FontSize(7)
                                           .SemiBold();
                                   });

                               });
                           });

                           outerCol.Item().LineHorizontal(0.5f).LineColor(Colors.Black);
                           outerCol.Item().Column(col =>
                           {
                               col.Item().AlignRight().PaddingRight(3).PaddingBottom(2).Text("توضیحات:").FontSize(7.5f).SemiBold();
                               col.Item().Padding(2).Height(25).AlignLeft().Text("");
                           });

                           outerCol.Item().LineHorizontal(0.5f).LineColor(Colors.Black);
                           outerCol.Item().Row(row =>
                           {
                               row.RelativeColumn(1).AlignCenter().Text("مهر و امضا فروشنده").FontSize(8).SemiBold();
                               row.ConstantColumn(1).BorderLeft(0.5f).BorderColor(Colors.Black);
                               row.RelativeColumn(1).AlignCenter().Text("مهر و امضا خریدار").FontSize(8).SemiBold();
                           });
                       });
                });
            });
        })
        .GeneratePdf(ms);

        return ms.ToArray();
    }


    string FixNumberOrder(string input) => string.IsNullOrEmpty(input) ? input : new string(input.Reverse().ToArray());

    public static string ToPersianWords(long number)
    {
        if (number == 0) return "صفر";
        string[] units = { "", "یک", "دو", "سه", "چهار", "پنج", "شش", "هفت", "هشت", "نه" };
        string[] teens = { "ده", "یازده", "دوازده", "سیزده", "چهارده", "پانزده", "شانزده", "هفده", "هجده", "نوزده" };
        string[] tens = { "", "", "بیست", "سی", "چهل", "پنجاه", "شصت", "هفتاد", "هشتاد", "نود" };
        string[] hundreds = { "", "یکصد", "دویست", "سیصد", "چهارصد", "پانصد", "ششصد", "هفتصد", "هشتصد", "نهصد" };
        string[] scales = { "", "هزار", "میلیون", "میلیارد" };
        var parts = new List<string>();
        int scaleIndex = 0;
        while (number > 0)
        {
            int chunk = (int)(number % 1000);
            if (chunk > 0)
            {
                var sb = new List<string>();
                int h = chunk / 100, t = (chunk % 100) / 10, u = chunk % 10;
                if (h > 0) sb.Add(hundreds[h]);
                if (t == 1 && u > 0) sb.Add(teens[u]);
                else { if (t > 1) sb.Add(tens[t]); if (u > 0) sb.Add(units[u]); }
                string chunkText = string.Join(" و ", sb);
                if (!string.IsNullOrEmpty(scales[scaleIndex])) chunkText += " " + scales[scaleIndex];
                parts.Insert(0, chunkText);
            }
            number /= 1000; scaleIndex++;
        }
        return string.Join(" و ", parts);
    }

    private string GetCustomerName()
    {
        if (_invoice.CustomerIndividual != null)
            return _invoice.CustomerIndividual.FullName ?? "-";
        if (_invoice.CustomerCompany != null)
            return _invoice.CustomerCompany.CompanyName ?? "-";
        return "-";
    }

    private string GetInvoiceTypeText(InvoiceType? type) =>
       type switch
       {
           InvoiceType.Proforma => "پیش‌فاکتور",
           InvoiceType.Invoice => "فاکتور فروش کالا و خدمات",
           _ => "-"
       };


    private string GetInvoiceStatusText(InvoiceStatus? status) =>
        status switch
        {
            InvoiceStatus.Draft => "پیش‌نویس",
            InvoiceStatus.Sent => "ارسال شده",
            InvoiceStatus.Approved => "تایید شده",
            InvoiceStatus.Paid => "پرداخت شده",
            InvoiceStatus.Canceled => "لغو شده",
            _ => "-"
        };

    private string ToPersianNumber(decimal value)
    {
        var persianDigits = new[] { '۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹' };
        var english = value.ToString("N0");
        var persian = english.Select(c => char.IsDigit(c) ? persianDigits[c - '0'] : c).Aggregate("", (a, b) => a + b);
        return "\u200E" + new string(persian.Reverse().ToArray()) + "\u200E";
    }

    private string ToPersianNumber(int value) => ToPersianNumber((decimal)value);

    private string ToPersianDate(DateTime? date)
    {
        if (!date.HasValue) return "-";
        var pc = new PersianCalendar();
        string year = ToPersianDigits(pc.GetYear(date.Value).ToString());
        string month = ToPersianDigits(pc.GetMonth(date.Value).ToString("00"));
        string day = ToPersianDigits(pc.GetDayOfMonth(date.Value).ToString("00"));
        var reversed = new string($"{year}/{month}/{day}".Reverse().ToArray());
        return "\u200E" + reversed + "\u200E";
    }

    private string ToPersianDigits(string input)
    {
        var persianDigits = new[] { '۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹' };
        return string.Concat(input.Select(c => char.IsDigit(c) ? persianDigits[c - '0'] : c));
    }


    private string GetSellerName() => _sellerInfo.CompanyName;
    private string GetSellerRegisterOrNationalId() => _sellerInfo.RegistrationNumber;
    private string GetSellerEconomicCode() => _sellerInfo.EconomicCode;
    private string GetSellerProvince() => _sellerInfo.Province;
    private string GetSellerCity() => _sellerInfo.City;
    private string GetSellerPostalCode() => _sellerInfo.PostalCode;
    private string GetSellerFullAddress() => _sellerInfo.FullAddress;

  
    private string GetRegisterOrNationalId() => _invoice.CustomerIndividual?.NationalCode ?? _invoice.CustomerIndividual?.IdentityNumber ?? _invoice.CustomerCompany?.RegisterNumber ?? _invoice.CustomerCompany?.NationalId ?? "-";
    private string GetEconomicCode() => _invoice.CustomerCompany?.EconomicCode ?? "-";
    private string GetProvince() => _invoice.CustomerIndividual?.Addresses.FirstOrDefault()?.Province?.Name ?? _invoice.CustomerCompany?.Addresses.FirstOrDefault()?.Province?.Name ?? "-";
    private string GetCity() => _invoice.CustomerIndividual?.Addresses.FirstOrDefault()?.City?.Name ?? _invoice.CustomerCompany?.Addresses.FirstOrDefault()?.City?.Name ?? "-";
    private string GetPostalCode() => _invoice.CustomerIndividual?.Addresses.FirstOrDefault()?.PostalCode ?? _invoice.CustomerCompany?.Addresses.FirstOrDefault()?.PostalCode ?? "-";
    private string GetFullAddress() => _invoice.CustomerIndividual?.Addresses.FirstOrDefault()?.FullAddress ?? _invoice.CustomerCompany?.Addresses.FirstOrDefault()?.FullAddress ?? "-";
}
