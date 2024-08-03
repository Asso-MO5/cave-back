const MACHINE = {
  id: 'id',
  name: 'name',
  slug: 'slug',
  release_year: 'release_year',
  description: 'description',
  additionnal_information: 'additionnal_information',
  cover_image: 'cover_image',
  manufacturers_id: 'manufacturers_id',
  author_id: 'author_id',
  created_at: 'created_at',
  updated_at: 'updated_at',
}

const MACHINE_HISTORY = {
  ...MACHINE,
  machine_id: 'machine_id',
  medias: 'medias',
  version: 'version',
  modified_at: 'modified_at',
}

const MACHINE_MEDIA = {
  id: 'id',
  media_id: 'media_id',
  machine_id: 'machine_id',
  created_at: 'created_at',
  updated_at: 'updated_at',
  author_id: 'author_id',
}

module.exports = {
  MACHINE,
  MACHINE_HISTORY,
  MACHINE_MEDIA,
}
