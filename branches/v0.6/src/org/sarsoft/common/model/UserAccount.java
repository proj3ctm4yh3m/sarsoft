package org.sarsoft.common.model;

import java.util.Set;

import javax.persistence.Entity;
import javax.persistence.Id;
import javax.persistence.OneToMany;

import org.hibernate.annotations.Cascade;
import org.sarsoft.plans.model.Search;

@Entity
public class UserAccount {

	private String name;
	private String email;
	private Set<Search> searches;

	@Id
	public String getName() {
		return name;
	}
	public void setName(String name) {
		this.name = name;
	}

	@OneToMany(mappedBy="account")
	@Cascade({org.hibernate.annotations.CascadeType.ALL,org.hibernate.annotations.CascadeType.DELETE_ORPHAN})
	public Set<Search> getSearches() {
		return searches;
	}
	public void setSearches(Set<Search> searches) {
		this.searches = searches;
	}
	public String getEmail() {
		return email;
	}
	public void setEmail(String email) {
		this.email = email;
	}

}
