const COMPANY = {
  id: 'id',
  name: 'name',
  slug: 'slug',
  description: 'description',
  logo_id: 'logo_id',
  country: 'country',
  activities: 'activities',
  author_id: 'author_id',
  borned_at: 'borned_at',
  created_at: 'created_at',
  updated_at: 'updated_at',
}

const COMPANY_HISTORY = {
  ...COMPANY,
  editor_id: 'editor_id',
  version: 'version',
  modified_at: 'modified_at',
}

module.exports = {
  COMPANY,
  COMPANY_HISTORY,
}
