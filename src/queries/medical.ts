export const getMedicalsBySubcategory = (
  subCategoryId: number,
  lastPrice: number | null,
  lastMedicalId: number | null,
  limit = 10,
  sortOrder: string
) => {
  // Validate sortOrder to ensure it is either 'ASC' or 'DESC'
  if (!["ASC", "DESC"].includes(sortOrder.toUpperCase())) {
    throw new Error('Invalid sort order. Please use "ASC" or "DESC".');
  }

  let query;

  // Initial query without lastPrice and lastId
  if (!lastPrice || !lastMedicalId) {
    query = `
        SELECT 
            "m"."id",
            "m"."iconUrl",
            "m"."name",
            "m"."address",
            "mc"."price"
        FROM 
            "Medical"  AS "m"
        JOIN 
            "MedicalCategory" AS "mc" ON "mc"."medicalId" = "m"."id"
        WHERE 
            "mc"."subCategoryId" = ${subCategoryId}
        ORDER BY 
            "mc"."price" ${sortOrder}, "m"."id" ${sortOrder}
        LIMIT ${limit};
      `;
  } else {
    // Pagination logic when lastPrice and lastId are provided
    query = `
        SELECT 
            "m"."id",
            "m"."iconUrl",
            "m"."name",
            "m"."address",
            "mc"."price"
        FROM 
            "Medical" AS  "m"
        JOIN 
            "MedicalCategory" AS "mc" ON "mc"."medicalId" = "m"."id"
        WHERE 
            "mc"."subCategoryId" = ${subCategoryId} AND
            (
                (CASE WHEN '${sortOrder}' = 'ASC' THEN "mc"."price" > ${lastPrice} OR ("mc"."price" = ${lastPrice} AND "m"."id" > ${lastMedicalId})
                      ELSE "mc"."price" < ${lastPrice} OR ("mc"."price" = ${lastPrice} AND "m"."id" < ${lastMedicalId}) END)
            )
        ORDER BY 
            "mc"."price" ${sortOrder}, "m"."id" ${sortOrder}
        LIMIT ${limit};
      `;
  }

  return query;
};
