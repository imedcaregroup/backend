export const getMedicalsBySubcategory = (
  subCategoryIds: number[],
  lastPrice: number | null,
  lastMedicalId: number | null,
  limit = 10,
  sortOrder: string,
) => {
  let query;

  const subCategoryArray = subCategoryIds.join(",");

  // Query to fetch medicals and subcategory details
  if (!lastPrice || !lastMedicalId) {
    query = `
        WITH subcategory_data AS (
          SELECT 
              "mc"."subCategoryId",
              "s"."name" AS "subCategoryName",
              SUM("mc"."price") AS "totalPrice"
          FROM 
              "MedicalCategory" AS "mc"
          JOIN 
              "SubCategory" AS "s" ON "mc"."subCategoryId" = "s"."id"
          WHERE 
              "mc"."subCategoryId" = ANY (ARRAY[${subCategoryArray}])
          GROUP BY 
              "mc"."subCategoryId", "s"."name"
        )
        SELECT 
            "m"."id",
            "m"."iconUrl",
            "m"."imageUrl",
            "m"."name",
            "m"."address",
            "m"."lat",
            "m"."lng",
            SUM("mc"."price") AS "price",
            ARRAY_AGG(
              JSON_BUILD_OBJECT(
                'subCategoryName', "sd"."subCategoryName",
                'totalPrice', "sd"."totalPrice"
              )
            ) AS "subcategories"
        FROM 
            "Medical" AS "m"
        JOIN 
            "MedicalCategory" AS "mc" ON "mc"."medicalId" = "m"."id"
        JOIN 
            subcategory_data AS "sd" ON "mc"."subCategoryId" = "sd"."subCategoryId"
        WHERE 
            "mc"."subCategoryId" = ANY (ARRAY[${subCategoryArray}])
        GROUP BY 
            "m"."id", "m"."iconUrl", "m"."imageUrl", "m"."name", "m"."address", "m"."lat", "m"."lng"
        HAVING 
            ARRAY_AGG("mc"."subCategoryId") @> ARRAY[${subCategoryArray}]
        ORDER BY 
            "price" ${sortOrder}, "m"."id" ${sortOrder}
        LIMIT ${limit};
      `;
  } else {
    query = `
        WITH subcategory_data AS (
          SELECT 
              "mc"."subCategoryId",
              "s"."name" AS "subCategoryName",
              SUM("mc"."price") AS "totalPrice"
          FROM 
              "MedicalCategory" AS "mc"
          JOIN 
              "SubCategory" AS "s" ON "mc"."subCategoryId" = "s"."id"
          WHERE 
              "mc"."subCategoryId" = ANY (ARRAY[${subCategoryArray}])
          GROUP BY 
              "mc"."subCategoryId", "s"."name"
        )
        SELECT 
            "m"."id",
            "m"."iconUrl",
            "m"."imageUrl",
            "m"."name",
            "m"."address",
            "m"."lat",
            "m"."lng",
            SUM("mc"."price") AS "price",
            ARRAY_AGG(
              JSON_BUILD_OBJECT(
                'subCategoryName', "sd"."subCategoryName",
                'totalPrice', "sd"."totalPrice"
              )
            ) AS "subcategories"
        FROM 
            "Medical" AS "m"
        JOIN 
            "MedicalCategory" AS "mc" ON "mc"."medicalId" = "m"."id"
        JOIN 
            subcategory_data AS "sd" ON "mc"."subCategoryId" = "sd"."subCategoryId"
        WHERE 
            "mc"."subCategoryId" = ANY (ARRAY[${subCategoryArray}]) AND
            (
                CASE WHEN '${sortOrder}' = 'ASC'
                THEN "mc"."price" > ${lastPrice} OR ("mc"."price" = ${lastPrice} AND "m"."id" > ${lastMedicalId})
                ELSE "mc"."price" < ${lastPrice} OR ("mc"."price" = ${lastPrice} AND "m"."id" < ${lastMedicalId}) END
            )
        GROUP BY 
            "m"."id", "m"."iconUrl", "m"."imageUrl", "m"."name", "m"."address", "m"."lat", "m"."lng"
        HAVING 
            ARRAY_AGG("mc"."subCategoryId") @> ARRAY[${subCategoryArray}]
        ORDER BY 
            "price" ${sortOrder}, "m"."id" ${sortOrder}
        LIMIT ${limit};
      `;
  }

  return query;
};
