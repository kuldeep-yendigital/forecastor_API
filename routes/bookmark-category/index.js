const express = require('express');
const { intersection } = require('lodash');
const router = express.Router();
const PromiseQuery = require('../../lib/data/promiseQuery');
const bookmark = require('../../lib/bookmark');
const auth0 = require('./../../lib/auth0');

// Get list of categories
router.get('/categories', (req, res, next) => {
  const db = new PromiseQuery();
  const subscriptionIds = auth0.api.account.getSubscriptions(req.auth);
  if (!subscriptionIds.length) {
    return res.status(403).json({ message : 'No valid subscriptions found.' });
  }

  // Get the order
  db.query('SELECT * FROM Bookmark_Category_Order WHERE id = 0 LIMIT 1')
    .then((result) => {
      console.log(result);
      let order = null;
      if (result && result.length > 0) {
        order = result[0].order;

        const newConn = new PromiseQuery();
        return newConn.query(`SELECT * from Bookmark_Categories ORDER BY FIELD(id, ${order})`);
      }
      else {
        const newConn = new PromiseQuery();
        return newConn.query('SELECT * from Bookmark_Categories');
      }
    })
    .then(rows => {
      // Check if user can access category by subscription 
      // and append boolean result to row (isEnabled)
      const newRows = rows.map(row => {
        const skus = row.sku.split(':');
        console.log('skus', skus);
        console.log('subscriptionIds', subscriptionIds);

        const isEnabled = !!intersection(skus, subscriptionIds.map(id => id.value)).length

        console.log('row', row);
        console.log('isEnabled', isEnabled);
        return { ...row, isEnabled };
      })
      return res.json(newRows);
    })
    .catch(next)
});

// Delete hash
router.delete('/hash/:id', (req, res, next) => {
  const db = new PromiseQuery();
  const { id } = req.params;

  if (!id) {
    return res.status(400).json({
      message: 'ID is required'
    });
  }

  db.query(`DELETE FROM Bookmark_Hashes WHERE id = ? LIMIT 1`, [id])
    .then((result) => res.json(result))
    .catch(next);
});

// Create hash
router.post('/hash', (req, res, next) => {
  const db = new PromiseQuery();
  const { subcategory_id, hash, replacedHash } = req.body;

  if(replacedHash) {
    db.query(`
      INSERT INTO
        Bookmark_Hashes 
      SET
        subcategory_id = ?,
        hash = ?,
        the_order = 0
      `, [subcategory_id, hash])
      .catch(next);
  }
  else {
    db.query(`
      INSERT INTO
        Bookmark_Hashes 
      SET
        subcategory_id = ?,
        hash = ?,
        the_order = 0
    `, [subcategory_id, hash])
      .then(row => res.json({ msg: 'Success', insertId: row.insertId }))
      .catch(next);

  }

});

// Get list of categories
router.get('/subcategories', (req, res, next) => {
  const outerDB = new PromiseQuery();
  const { category_id } = req.query;

  const getSubcategories = outerDB.query(`
    SELECT *
    FROM Bookmark_Subcategories
    WHERE category_id = ?
    ORDER BY id ASC
    `, [category_id]);

  const getPopularBookmarks = bookmark.popularBookmarks();

  //  Grab both saved bookmarks and subcategories
  Promise.all([getSubcategories, getPopularBookmarks])
  .then(([ subCat, popularBookmarks]) => {

    const getHashesBySubcategory = (subcategory_id) => {
      const db = new PromiseQuery();

      return db.query(`
        SELECT *
        FROM Bookmark_Hashes
        WHERE subcategory_id = ?
        ORDER BY id ASC
      `, [subcategory_id])
      .then(hashes => {
        return hashes.map(hash => {
          const savedSearch = popularBookmarks.find(el => el.hash === hash.hash);
          return {
            ...savedSearch,
            dbEntry: hash,
            hashId: hash.id,
          };
        })
      })
    }

    // Grab all hashes
    const proms = subCat.map(row => getHashesBySubcategory(row.id).then(resp => ({ ...row, hash: resp })));
    return Promise.all(proms)
  })
  .then(resp => res.json(resp))
  .catch(next)
});

router.post('/subcategory', (req, res, next) => {
  const db = new PromiseQuery();
  const { title, parentid } = req.body;

  if (!title || !parentid) {
    res.status(400).json({
      msg: 'Bad Request. Title and ParentID are required.'
    });
  }

  db.query(`SELECT MAX(the_order) FROM Bookmark_Subcategories`)
    .then(([result]) => {
      return db.query(`
        INSERT INTO
          Bookmark_Subcategories
        SET
          title = ?,
          the_order = ?,
          category_id = ?
      `, [title, result['MAX(the_order)'] + 1, parentid])
    })
    .then(row => res.json({ msg: 'Success', insertId: row.insertId }))
    .catch(next);
});

router.delete('/subcategory/:id', (req, res, next) => {
  const db = new PromiseQuery();
  const { id } = req.params;

  db.query(`DELETE
    From Bookmark_Subcategories
    WHERE id = ?
    LIMIT 1
  `, [id])
  .then((result) => res.json(result))
  .catch(next)
});

router.put('/subcategory/:id', (req, res, next) => {
  const db = new PromiseQuery();
  const { title, category_id, the_order } = req.body;

  if (!the_order || !title || !category_id) {
    res.status(400).json({
      message: 'ID, Title and ParentID are required'
    });
  }

  const { id } = req.params;

  db.query(`
    UPDATE Bookmark_Subcategories
    SET the_order = the_order + 1
    WHERE the_order >= ?
  `, [the_order])
  .then(row => {
    return db.query(`UPDATE Bookmark_Subcategories SET ? WHERE id = ?`, [
      { title, the_order, category_id }, id
    ]);
  })
  .then(row => {
    if(row.changedRows === 0) return res.status(400).json({ msg: 'Nothing changed'});
    res.json({ msg: 'ok', feedback: row.message  })
  })
  .catch(next)
});

// Create
router.post('/category', (req, res, next) => {
  const db = new PromiseQuery();
  const { title, sku = '' } = req.body;

  if(!title) res.status(400).json({ msg: 'Need title and sku.' });

  // They should have transactions/subqueries but memsql is awful so
  // not possible.
  let insertedId = null;
  db.query(`
    INSERT INTO
      Bookmark_Categories 
    SET
      title = ?,
      sku = ?,
      the_order = 0
  `, [title, sku]
  )
  .then((row) => {
    // Get the order
    insertedId = row.insertId;
    return db.query('SELECT * FROM Bookmark_Category_Order WHERE id = 0 LIMIT 1');
  })
  .then((orderRes) => {
    const order = orderRes[0].order.split(',');
    order.push(insertedId);
    return db.query(`UPDATE Bookmark_Category_Order SET \`order\` = '${order.join(',')}' WHERE id = 0`);
  })
  .then(row => res.json({ msg: 'Success', insertId: insertedId }))
  .catch(next);
});

// Get single
router.get('/category/:id', (req, res, next) => {
  const db = new PromiseQuery();
  const { id } = req.params;

  db.query('SELECT * FROM Bookmark_Categories WHERE id = ? LIMIT 1', [id])
  .then((row) => {
    if(!row.length) return res.status(404).json({ error: 'Not found' })
    res.json(row[0])
  })
  .catch(next)
});

router.put('/category/reorder', (req, res, next) => {
  const db = new PromiseQuery();
  const { newOrder } = req.body;

  if (!newOrder) {
    return res.status(400).json({ message: 'New Order is required' });
  }

  db.query(`UPDATE Bookmark_Category_Order SET \`order\` = '${newOrder}' WHERE id = 0 LIMIT 1`)
    .then(() => {
      return res.json({ message: 'ok' });
    })
    .catch(next);
});

// Get single
router.delete('/category/:id', (req, res, next) => {
  const db = new PromiseQuery();
  const { id } = req.params;

  db.query('SELECT * FROM Bookmark_Category_Order WHERE id = 0 LIMIT 1')
    .then((theOrder) => {
      const newOrder = theOrder[0].order.split(',');
      newOrder.splice(newOrder.indexOf(id), 1);

      return db.query(`UPDATE Bookmark_Category_Order SET \`order\` = '${newOrder.join(',')}'`);
    })
    .then(() => {
      return db.query(`DELETE
        FROM Bookmark_Categories
        WHERE id = ?
        LIMIT 1
      `, [id])
    })
    .then((result) => res.json(result))
    .catch(next)
});

// Update
router.put('/category/:id', (req, res, next) => {
  const db = new PromiseQuery();
  const { title, sku = '', the_order } = req.body;
  const { id } = req.params;

  if(!title || !id) {
    return res.status(400).json({ msg: 'Need title, sku and id' });
  }
  db.query(`UPDATE Bookmark_Categories SET ? WHERE id = ?`, [
      { title, sku, the_order }, id
    ])
    .then(row => {
      if(row.changedRows === 0) return res.status(400).json({ msg: 'Nothing changed'});
      res.json({ msg: 'ok', feedback: row.message  })
    })
    .catch(next)
});

module.exports = router;
