CREATE TABLE IF NOT EXISTS `Bookmark_Categories` (
  `id` bigint(11) unsigned NOT NULL AUTO_INCREMENT,
  `title` varchar(75) NOT NULL,
  `sku` varchar(1000) NOT NULL,
  `the_order` int unsigned NOT NULL,
  PRIMARY KEY (`id`)
);

INSERT INTO `Bookmark_Categories`
VALUES
  (1, 'Mobile', 'PT0110:PT0111:PT0112:PT0113:PT0114:PT0106:PT0116:PT0117:PT0118:PT0119:PT0107', 1),
  (2, 'Fixed', 'PT0110:PT0111:PT0112:PT0113:PT0114:PT0106:PT0116:PT0117:PT0118:PT0119:PT0108', 2),
  (3, 'TV', 'PT0110:PT0111:PT0112:PT0113:PT0114:PT0106:PT0116:PT0117:PT0118:PT0119:PT0109', 3),
  (4, 'Service Provider Markets', 'PT0110:PT0111:PT0112:PT0113:PT0114:PT0114:PT0116:PT0117:PT0118:PT0119:PT0115', 4),
  (5, 'OTT Video', 'PT0110:PT0111:PT0112:PT0113:PT0114:PT0114:PT0116:PT0117:PT0118:PT0119:PT0115', 5),
  (6, 'Service Provider Technology', 'PT0115', 6),
  (7, 'Consumer and Entertainment Services', 'PT0120', 7),
  (8, 'Enterprise Services', 'PT0121', 8),
  (9, 'Internet of Things', 'PT0110:PT0111:PT0112:PT0113:PT0114:PT0122', 9),
  (10, 'IT Markets', 'PT0123', 10);


CREATE TABLE IF NOT EXISTS `Bookmark_Subcategories` (
  `id` bigint(11) unsigned NOT NULL AUTO_INCREMENT,
  `title` varchar(75) NOT NULL,
  `the_order` int unsigned NOT NULL,
  `category_id` bigint(11) unsigned NOT NULL,
  PRIMARY KEY (`id`)
);


INSERT INTO `Bookmark_Subcategories`
VALUES
  (1, 'test category onee', 1, 1),
  (2, 'another test', 2, 1),
  (3, 'category!', 3, 2),
  (4, 'hello!', 4, 2);



CREATE TABLE IF NOT EXISTS `Bookmark_Hashes` (
  `id` bigint(11) unsigned NOT NULL AUTO_INCREMENT,
  `hash` varchar(75) NOT NULL,
  `the_order` int unsigned NOT NULL,
  `subcategory_id` bigint(11) unsigned NOT NULL,
  PRIMARY KEY (`id`)
);

