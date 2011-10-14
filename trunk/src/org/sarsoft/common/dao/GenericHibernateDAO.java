package org.sarsoft.common.dao;

import java.io.Serializable;
import java.util.Date;
import java.util.List;

import org.hibernate.Criteria;
import org.hibernate.HibernateException;
import org.hibernate.Session;
import org.hibernate.criterion.Restrictions;
import org.sarsoft.common.model.IPreSave;
import org.sarsoft.common.model.SarModelObject;
import org.sarsoft.common.model.Tenant;
import org.sarsoft.common.model.Tenant.Permission;
import org.sarsoft.common.util.RuntimeProperties;
import org.springframework.orm.hibernate3.HibernateCallback;
import org.springframework.orm.hibernate3.support.HibernateDaoSupport;

public class GenericHibernateDAO extends HibernateDaoSupport {

	@SuppressWarnings("rawtypes")
	private Criteria addTenantRestriction(Class cls, Criteria crit) {
		Class smo = SarModelObject.class;
		while(cls != null) {
			if(cls == smo) {
				return crit.add(Restrictions.eq("tenant", RuntimeProperties.getTenant()));
			}
			cls = cls.getSuperclass();
		}
		return crit;
	}

	private <T> T checkTenantPermission(T obj) {
		if(obj == null) return null;
		if(obj instanceof SarModelObject) {
			SarModelObject smo = (SarModelObject) obj;
			if(smo.getTenant().equalsIgnoreCase(RuntimeProperties.getTenant())) return obj;
			return null;
		}
		return obj;
	}

	@SuppressWarnings("unchecked")
	public <T> T loadByPk(final Class <T> T, final long pk) {
		return getHibernateTemplate().execute(new HibernateCallback<T>() {
			public T doInHibernate(final Session session) throws HibernateException {
				return checkTenantPermission((T) session.load(T, pk));
			}
		});
	}

	@SuppressWarnings({"unchecked"})
	public <T> T getByPk(final Class <T> T, final long pk) {
		return getHibernateTemplate().execute(new HibernateCallback<T>() {
			public T doInHibernate(final Session session) throws HibernateException {
				return checkTenantPermission((T) session.get(T, pk));
			}
		});
	}

	@SuppressWarnings({"unchecked"})
	public <T> T getByPk(final Class <T> T, final Serializable id) {
		return getHibernateTemplate().execute(new HibernateCallback<T>() {
			public T doInHibernate(final Session session) throws HibernateException {
				return checkTenantPermission((T) session.get(T, id));
			}
		});
	}

	@SuppressWarnings({"unchecked"})
	public <T> T load(final Class <T> T, final long id) {
		List<T> list = getHibernateTemplate().executeFind(new HibernateCallback<List<T>>() {
			public List<T> doInHibernate(final Session session) throws HibernateException {
				return addTenantRestriction(T, session.createCriteria(T).add(Restrictions.eq("id", id))).list();
			}
		});
		if(list.size() > 0) return list.get(0);
		return null;
	}

	@SuppressWarnings({"unchecked"})
	public <T> T load(final Class <T> T, final int id) {
		List<T> list = getHibernateTemplate().executeFind(new HibernateCallback<List<T>>() {
			public List<T> doInHibernate(final Session session) throws HibernateException {
				return addTenantRestriction(T, session.createCriteria(T).add(Restrictions.eq("id", id))).list();
			}
		});
		if(list.size() > 0) return list.get(0);
		return null;
	}


	@SuppressWarnings({"unchecked"})
	public <T> List<T> loadAll(final Class <T> T) {
		return getHibernateTemplate().execute(new HibernateCallback<List<T>>() {
			public List<T> doInHibernate(final Session session) throws HibernateException {
				return addTenantRestriction(T, session.createCriteria(T)).list();
			}
		});
	}

	@SuppressWarnings({ "unchecked", "rawtypes" })
	public void save(final Object obj) {
		getHibernateTemplate().execute(new HibernateCallback() {
			public Object doInHibernate(final Session session) throws HibernateException {
				if(RuntimeProperties.getUserPermission() != Permission.WRITE && RuntimeProperties.getUserPermission() != Permission.ADMIN) return null;
				if(obj instanceof IPreSave) ((IPreSave) obj).preSave();
				session.save(obj);
				session.flush();
				return null;
			}
		});
	}

	@SuppressWarnings({ "unchecked", "rawtypes" })
	public void superSave(final Object obj) {
		getHibernateTemplate().execute(new HibernateCallback() {
			public Object doInHibernate(final Session session) throws HibernateException {
				if(obj instanceof IPreSave) ((IPreSave) obj).preSave();
				session.save(obj);
				session.flush();
				return null;
			}
		});
	}

	@SuppressWarnings({ "unchecked", "rawtypes" })
	public void delete(final Object obj) {
		getHibernateTemplate().execute(new HibernateCallback() {
			public Object doInHibernate(final Session session) throws HibernateException {
				if(RuntimeProperties.getUserPermission() != Permission.WRITE && RuntimeProperties.getUserPermission() != Permission.ADMIN) return null;
				session.delete(obj);
				session.flush();
				return null;
			}
		});
	}

	@SuppressWarnings("unchecked")
	public <T> List<T> loadSince(final Class <T> T, final Date date) {
		return getHibernateTemplate().execute(new HibernateCallback<List<T>>() {
			public List<T> doInHibernate(final Session session) throws HibernateException {
				return addTenantRestriction(T, session.createCriteria(T).add(Restrictions.ge("updated", date))).list();
			}
		});
	}

	@SuppressWarnings({"unchecked"})
	public <T> T getByAttr(final Class <T> T, final String key, final String value) {
		List<T> list = getHibernateTemplate().executeFind(new HibernateCallback<List<T>>() {
			public List<T> doInHibernate(final Session session) throws HibernateException {
				return addTenantRestriction(T, session.createCriteria(T).add(Restrictions.eq(key, value))).list();
			}
		});
		if(list.size() > 0) return list.get(0);
		return null;
	}

	@SuppressWarnings({"unchecked","rawtypes"})
	public <T> List<T> getAllByAttr(final Class <T> T, final String key, final Enum value) {
		List<T> list = getHibernateTemplate().executeFind(new HibernateCallback<List<T>>() {
			public List<T> doInHibernate(final Session session) throws HibernateException {
				return addTenantRestriction(T, session.createCriteria(T).add(Restrictions.eq(key, value))).list();
			}
		});
		return list;
	}

	@SuppressWarnings({"unchecked"})
	public <T> List<T> getAllByAttr(final Class <T> T, final String key, final Object value) {
		List<T> list = getHibernateTemplate().executeFind(new HibernateCallback<List<T>>() {
			public List<T> doInHibernate(final Session session) throws HibernateException {
				return addTenantRestriction(T, session.createCriteria(T).add(Restrictions.eq(key, value))).list();
			}
		});
		return list;
	}

	@SuppressWarnings({"unchecked","rawtypes"})
	public List<Tenant> getAllTenants() {
		List list = getHibernateTemplate().executeFind(new HibernateCallback() {
			public Object doInHibernate(final Session session) throws HibernateException {
				Criteria c = session.createCriteria(Tenant.class).add(Restrictions.isNull("account"));
				return c.list();
			}
		});
		return (List<Tenant>) list;
	}
}