package org.sarsoft.common.dao;

import java.util.Date;
import java.util.List;
import java.util.Map;

import org.sarsoft.common.model.IPreSave;

import org.hibernate.Criteria;
import org.hibernate.HibernateException;
import org.hibernate.Session;
import org.hibernate.criterion.Restrictions;
import org.springframework.orm.hibernate3.HibernateCallback;
import org.springframework.orm.hibernate3.support.HibernateDaoSupport;

public class GenericHibernateDAO extends HibernateDaoSupport {

	@SuppressWarnings("unchecked")
	public Object load(final Class cls, final long id) {
		return getHibernateTemplate().execute(new HibernateCallback() {
			public Object doInHibernate(final Session session) throws HibernateException {
				return session.load(cls, id);
			}
		});
	}

	@SuppressWarnings("unchecked")
	public Object load(final Class cls, final int id) {
		return getHibernateTemplate().execute(new HibernateCallback() {
			public Object doInHibernate(final Session session) throws HibernateException {
				return session.load(cls, id);
			}
		});
	}

	@SuppressWarnings("unchecked")
	public List loadAll(final Class cls) {
		return (List) getHibernateTemplate().execute(new HibernateCallback() {
			public Object doInHibernate(final Session session) throws HibernateException {
				final Criteria crit = session.createCriteria(cls);
				return crit.list();
			}
		});
	}

	@SuppressWarnings("unchecked")
	public void save(final Object obj) {
		getHibernateTemplate().execute(new HibernateCallback() {
			public Object doInHibernate(final Session session) throws HibernateException {
				if(obj instanceof IPreSave) ((IPreSave) obj).preSave();
				session.save(obj);
				session.flush();
				return null;
			}
		});
	}

	@SuppressWarnings("unchecked")
	public void delete(final Object obj) {
		getHibernateTemplate().execute(new HibernateCallback() {
			public Object doInHibernate(final Session session) throws HibernateException {
				session.delete(obj);
				session.flush();
				return null;
			}
		});
	}

	@SuppressWarnings("unchecked")
	public List loadSince(final Class cls, final Date date) {
		return (List) getHibernateTemplate().execute(new HibernateCallback() {
			public Object doInHibernate(final Session session) throws HibernateException {
				Criteria c  = session.createCriteria(cls).add(Restrictions.ge("updated", date));
				return c.list();
			}
		});
	}

	@SuppressWarnings("unchecked")
	public Object getByAttr(final Class cls, final String key, final String value) {
		List list = getHibernateTemplate().executeFind(new HibernateCallback() {
			public Object doInHibernate(final Session session) throws HibernateException {
				return session.createCriteria(cls).add(Restrictions.eq(key, value)).list();
			}
		});
		if(list.size() > 0) return list.get(0);
		return null;
	}
}