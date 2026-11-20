/* (C)2026 */
package com.robertforpresent.api;

import static com.tngtech.archunit.base.DescribedPredicate.not;
import static com.tngtech.archunit.core.domain.JavaClass.Predicates.simpleNameEndingWith;
import static com.tngtech.archunit.lang.syntax.ArchRuleDefinition.classes;
import static com.tngtech.archunit.lang.syntax.ArchRuleDefinition.noClasses;

import com.tngtech.archunit.core.domain.JavaClasses;
import com.tngtech.archunit.junit.AnalyzeClasses;
import com.tngtech.archunit.junit.ArchTest;
import com.tngtech.archunit.lang.ArchRule;
import java.util.List;
import org.springframework.web.bind.annotation.RestController;

/**
 * Architecture rules for the hexagonal module layout (catalog, collection, scraper, thumbnail).
 * Dependencies must point inward: domain <- application <- infrastructure/presentation, and
 * modules talk to each other only through ports in the consuming module's domain.
 *
 * <p>Test classes are excluded because they live in the same packages as the code under test.</p>
 */
@AnalyzeClasses(packages = "com.robertforpresent.api")
class ArchitectureTest {

    private static final List<String> MODULES =
            List.of("catalog", "collection", "scraper", "thumbnail");

    @ArchTest
    static final ArchRule domainDoesNotDependOnOuterLayers =
            noClasses()
                    .that()
                    .resideInAnyPackage("..domain..")
                    .and(not(simpleNameEndingWith("Test")))
                    .should()
                    .dependOnClassesThat()
                    .resideInAnyPackage(
                            "..application..", "..infrastructure..", "..presentation..");

    @ArchTest
    static final ArchRule applicationDoesNotDependOnInfrastructureOrPresentation =
            noClasses()
                    .that()
                    .resideInAnyPackage("..application..")
                    .and(not(simpleNameEndingWith("Test")))
                    .should()
                    .dependOnClassesThat()
                    .resideInAnyPackage("..infrastructure..", "..presentation..");

    @ArchTest
    static final ArchRule presentationDoesNotDependOnInfrastructure =
            noClasses()
                    .that()
                    .resideInAnyPackage("..presentation..")
                    .and(not(simpleNameEndingWith("Test")))
                    .should()
                    .dependOnClassesThat()
                    .resideInAnyPackage("..infrastructure..");

    @ArchTest
    static final ArchRule controllersLiveInPresentationRest =
            classes()
                    .that()
                    .areAnnotatedWith(RestController.class)
                    .should()
                    .resideInAnyPackage("..presentation.rest..");

    @ArchTest
    static void applicationLayersDoNotDependOnOtherModulesApplications(JavaClasses classes) {
        for (String module : MODULES) {
            for (String other : MODULES) {
                if (module.equals(other)) {
                    continue;
                }
                noClasses()
                        .that()
                        .resideInAPackage(".." + module + ".application..")
                        .and(not(simpleNameEndingWith("Test")))
                        .should()
                        .dependOnClassesThat()
                        .resideInAPackage(".." + other + ".application..")
                        .check(classes);
            }
        }
    }
}
