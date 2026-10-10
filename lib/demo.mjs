// Entirely fictional menu prices for reproducible offline interaction, never official quotes.
const rows=[['d1','经典牛肉堡',18,27,430,'main'],['d2','香脆鸡腿堡',17,24,480,'main'],['d3','清爽鸡肉卷',16,20,360,'main'],['d4','双层牛肉堡',24,35,560,'main'],['d5','薯条',8,3,210,'side'],['d6','玉米杯',6,2,53,'side'],['d7','鸡翅',12,13,224,'side'],['d8','无糖可乐',6,0,0,'drink'],['d9','牛奶',8,7,129,'drink']];
export const demoMenu=rows.map(([code,name,price,protein,kcal,category])=>({code,name,priceCents:price*100,category,nutrition:{name,protein,kcal},image:null,tags:[]}));
