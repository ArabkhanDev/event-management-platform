package com.meet2be.model.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.domain.Page;

import java.util.List;

/**
 * One page of results plus what a client needs to render pagination controls.
 *
 * <p>Spring's own {@code Page} is deliberately not returned from controllers:
 * its JSON shape is an implementation detail that has changed between Boot
 * versions, and it carries sort/pageable internals no caller uses.
 *
 * @param <T> element type already mapped to its DTO
 */
@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class PageResponse<T> {

    private List<T> content;
    private int page;
    private int size;
    private long totalElements;
    private int totalPages;

    /** Wraps already-mapped content with the paging metadata of the source page. */
    public static <T> PageResponse<T> of(Page<?> source, List<T> content) {
        return PageResponse.<T>builder()
                .content(content)
                .page(source.getNumber())
                .size(source.getSize())
                .totalElements(source.getTotalElements())
                .totalPages(source.getTotalPages())
                .build();
    }
}
