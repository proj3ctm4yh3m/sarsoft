package org.sarsoft.common.dao;

import java.io.Serializable;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;
import java.util.Map;

import org.sarsoft.common.model.IPreSave;
import org.sarsoft.common.model.SarModelObject;
import org.sarsoft.common.util.RuntimeProperties;
import org.sarsoft.plans.model.Search;

import org.hibernate.Criteria;
import org.hibernate.Hibernate;
import org.hibernate.HibernateException;
import org.hibernate.ObjectNotFoundException;
import org.hibernate.Session;
import org.hibernate.criterion.Restrictions;
import org.springframework.orm.hibernate3.HibernateCallback;
import org.springframework.orm.hibernate3.support.HibernateDaoSupport;

public class GenericHibernateDAO extends HibernateDaoSupport {

	private Criteria addTenantRestriction(Class cls, Criteria crit) {
		Class smo = SarModelObject.class;
		while(cls != null) {
			if(cls == smo) {
				return crit.add(Restrictions.eq("search", RuntimeProperties.getSearch()));
			}
			cls = cls.getSuperclass();
		}
		return crit;
	}

	private Object checkTenantPermission(Object obj) {
		if(obj == null) return null;
		if(obj instanceof SarModelObject) {
			SarModelObject smo = (SarModelObject) obj;
			if(smo.getSearch().equalsIgnoreCase(RuntimeProperties.getSearch())) return obj;
			return null;
		}
		return obj;
	}

	@SuppressWarnings("unchecked")
	public Object loadByPk(final Class cls, final long pk) {
		return getHibernateTemplate().execute(new HibernateCallback() {
			public Object doInHibernate(final Session session) throws HibernateException {
				return checkTenantPermission(session.load(cls, pk));
			}
		});
	}

	@SuppressWarnings("unchecked")
	public Object getByPk(final Class cls, final long pk) {
		return getHibernateTemplate().execute(new HibernateCallback() {
			public Object doInHibernate(final Session session) throws HibernateException {
				return checkTenantPermission(session.get(cls, pk));
			}
		});
	}

	@SuppressWarnings("unchecked")
	public Object getByPk(final Class cls, final Serializable id) {
		return getHibernateTemplate().execute(new HibernateCallback() {
			public Object doInHibernate(final Session session) throws HibernateException {
				return checkTenantPermission(session.get(cls, id));
			}
		});
	}

	public Object load(final Class cls, final long id) {
		List list = getHibernateTemplate().executeFind(new HibernateCallback() {
			public Object doInHibernate(final Session session) throws HibernateException {
				return addTenantRestriction(cls, session.createCriteria(cls).add(Restrictions.eq("id", id))).list();
			}
		});
		if(list.size() > 0) return list.get(0);
		return null;
	}

	public Object load(final Class cls, final int id) {
		List list = getHibernateTemplate().executeFind(new HibernateCallback() {
			public Object doInHibernate(final Session session) throws HibernateException {
				return addTenantRestriction(cls, session.createCriteria(cls).add(Restrictions.eq("id", id))).list();
			}
		});
		if(list.size() > 0) return list.get(0);
		return null;
	}


	@SuppressWarnings("unchecked")
	public List loadAll(final Class cls) {
		return (List) getHibernateTemplate().execute(new HibernateCallback() {
			public Object doInHibernate(final Session session) throws HibernateException {
				final Criteria crit = addTenantRestriction(cls, session.createCriteria(cls));
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
				Criteria c  = addTenantRestriction(cls, session.createCriteria(cls).add(Restrictions.ge("updated", date)));
				return c.list();
			}
		});
	}

	@SuppressWarnings("unchecked")
	public Object getByAttr(final Class cls, final String key, final String value) {
		List list = getHibernateTemplate().executeFind(new HibernateCallback() {
			public Object doInHibernate(final Session session) throws HibernateException {
				return addTenantRestriction(cls, session.createCriteria(cls).add(Restrictions.eq(key, value))).list();
			}
		});
		if(list.size() > 0) return list.get(0);
		return null;
	}

	@SuppressWarnings("unchecked")
	public List getAllByAttr(final Class cls, final String key, final Enum value) {
		List list = getHibernateTemplate().executeFind(new HibernateCallback() {
			public Object doInHibernate(final Session session) throws HibernateException {
				return addTenantRestriction(cls, session.createCriteria(cls).add(Restrictions.eq(key, value))).list();
			}
		});
		return list;
	}

	@SuppressWarnings("unchecked")
	public List<Search> getAllSearches() {
		List list = getHibernateTemplate().executeFind(new HibernateCallback() {
			public Object doInHibernate(final Session session) throws HibernateException {
				Criteria c = session.createCriteria(Search.class).add(Restrictions.isNull("account"));
				return c.list();
			}
		});
		return (List<Search>) list;
	}
}