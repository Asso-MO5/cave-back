const knex = require('knex')({
  client: 'mysql2',
  connection: {
    host: process.env.DB_HOST,
    port: 3306,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
  },
})

/**
 * 
 * @param {Object} options
 * @param {String} options.tableName
 * @param {String} options.cursor
 * @param {Number} options.pageSize
 * @param {String} options.orderBy
 * @param {String} options.order
 * @param {Object} options.conditions
 
 * @returns {Promise<{ data: Object[], pagination: { pageSize: Number, hasNextPage: Boolean, totalPage: Number, nextCursor: String } }>}
 */
async function paginateCursor({
  tableName,
  cursor = null,
  pageSize = 10,
  orderBy = 'id',
  order = 'asc',
  conditions = {},
}) {
  const query = knex(tableName)
    .select('*')
    .orderBy(orderBy, order)
    .limit(pageSize + 1)

  for (const whereClause of conditions) query.where(...whereClause)

  const countQuery = knex(tableName).count('id as count').first()

  for (const whereClause of conditions) countQuery.where(...whereClause)

  const countResult = await countQuery
  const totalRecords = parseInt(countResult.count, 10)

  if (cursor) query.where(orderBy, order === 'asc' ? '>' : '<', cursor)

  const data = await query

  const hasNextPage = data.length > pageSize
  const totalPage = Math.ceil(totalRecords / pageSize)

  if (hasNextPage) data.pop()

  const nextCursor = hasNextPage ? data[data.length - 1][orderBy] : null

  return {
    data,
    pagination: {
      pageSize,
      hasNextPage,
      totalPage,
      nextCursor,
      totalItems: totalRecords,
    },
  }
}

module.exports = { knex, paginateCursor }
